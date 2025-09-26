# MyBlock Studio

MyBlock Studio is a twin-platform coding playground inspired by Scratch, OpenBlock, and mBlock. The
web editor provides a block-based workspace powered by Blockly with a live stage preview, while the
mobile application focuses on replaying JavaScript generated from the blocks.

## Repository structure

- `web/` – Vite + React web editor featuring custom Blockly blocks, a themed workspace, and a live
  sprite stage.
- `app/` – Expo React Native project for iOS, Android, and web that can replay generated JavaScript
  programs and includes curated samples.

## Getting started – web

```bash
cd web
npm install
npm run dev
```

Visit `http://localhost:5173` to open the editor. Drag blocks under the “when play clicked” hat, run
the program, and see both the generated JavaScript and the sprite stage update in real time.

### Troubleshooting npm install

If `npm install` fails with `403 Forbidden` errors when fetching packages such as `@types/react`, the
host machine is blocking outbound HTTPS traffic behind an Envoy proxy. You can confirm this with
`curl -I https://registry.npmjs.org/@types/react`, which returns the same `CONNECT tunnel failed`
message. In this environment the registry is unreachable, so dependency installation cannot
complete.

To fix the issue, run the install step from a network that allows HTTPS egress or configure npm with
working proxy credentials (for example, export `HTTPS_PROXY`/`HTTP_PROXY` that point to an accessible
gateway). Alternatively, download the packages in an environment with internet access and copy the
resulting `node_modules` directory into the container.

## Getting started – mobile

```bash
cd app
npm install
npm run start
```

Use the Expo CLI instructions to launch on an Android emulator, iOS simulator, or web. Paste the
JavaScript from the web editor into the mobile app to reproduce the animation or choose one of the
bundled samples.

## Project roadmap

- Expand the block library with sensing, operators, and variables categories.
- Add cloud project syncing between web and mobile clients.
- Introduce multi-sprite projects with costumes and sounds.
- Provide offline lesson packs for classrooms.

## Testing

Each package exposes a `test` script that runs a TypeScript no-emit check. After installing
dependencies, execute the following in the respective directory:

```bash
npm test
```

The command surfaces type errors in both the Vite web editor and the Expo mobile app.

## Publishing the repository to GitHub

This workspace does not come with a Git remote configured, so nothing is pushed anywhere by
default. To publish the code to your own GitHub account:

> **Note:** The hosted environment does not have access tokens or credentials for your GitHub
> account, and it cannot reach private networks outside of the proxy. Only you can add a remote and
> push commits from this workspace once you provide your own GitHub URL.

1. Create an empty repository on GitHub without any starter files (no README, license, or gitignore).
2. Add it as the `origin` remote inside this workspace:

   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   ```

3. Push the existing history to that remote:

   ```bash
   git push -u origin HEAD
   ```

After that initial push you can run `git push` normally whenever you want to sync new commits.
