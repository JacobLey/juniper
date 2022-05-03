import ChildProcess from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(ChildProcess.exec);

const getPackage = async (key: 'name' | 'version'): Promise<string> => {
    const packageJson = await exec(`npm pkg get ${key}`);
    return JSON.parse(packageJson.stdout) as string;
};

let [
    packageVersion,
    packageName,
] = await Promise.all([
    getPackage('version'),
    getPackage('name'),
]);

const exists = await exec(`npm view ${packageName}@${packageVersion} version`);
if (exists.stdout) {
    // Already exists
    await exec('npm version --git-tag-version=false patch');
    packageVersion = await getPackage('version');
}

// eslint-disable-next-line node/no-process-env
const gitSha = process.env.GIT_SHA!;

const hashVersion = `0.0.0-${gitSha}`;

const stillExists = await exec(`npm view ${packageName}@${hashVersion} version`);
// Possible version already exists if existing commit is pushed to new branch.
if (!stillExists.stdout) {
    // eslint-disable-next-line node/no-process-env
    await exec(`npm version --git-tag-version=false ${hashVersion}`);
    await exec('npm publish --tag=ignore');

    const canaryVersion = `${packageVersion}-canary-${gitSha.slice(0, 7)}`;
    await exec(`npm version --git-tag-version=false ${canaryVersion}`);
    // eslint-disable-next-line node/no-process-env
    await exec(`npm publish --tag=${process.env.GIT_BRANCH === 'main' ? 'canary' : 'ignore'}`);

    await exec(`npm dist-tag rm ${packageName} ignore`);
}
