# rssp.js

`rssp.js` is the JS SDK for RSSP.

## Get Started

### Install tools

Ensure you have installed all following tools:

- Node: v18.18.0
- Yarn: v1.22.0+

You can confirm your Node and Yarn's version with

```bash
$ node --version
v18.18.0

$ yarn --version
1.22.0+
```

### Install dependencies

```bash
$ yarn install
yarn install v1.22.10
[1/4] 🔍  Resolving packages...
success Already up-to-date.
✨  Done in 0.52s.
```

### Start WebpackDevServer

```bash
$ yarn serve-mock
｢wds｣: Project is running at http://0.0.0.0:3111/
...
```

Now you can check the test page with opening `http://bs-local.com:3111`.

### Run test

We run tests with `cypress`.

#### run unit test

```
$ yarn test
```

#### run integration(e2e) test

```
$ yarn e2e-test
```

### Build for production

```bash
$ yarn run build
```

### Build for bundle analyze

```bash
$ yarn analyze
```

Open `http://127.0.0.1:8888`

## amphtml

Amp Ad works with libraries from [amphtml](https://github.com/ampproject/amphtml). And sometimes development is required on that.
Refer to [here](https://github.rakops.com/gatd/rssp.js/blob/master/docs/apm.md) for more detail.

## Support Browser Guideline

[Support Browser Guideline](https://confluence.rakuten-it.com/confluence/pages/viewpage.action?pageId=1295359774)

## Directory Structure

| Directory       | Contents                                                     |
| --------------- | ------------------------------------------------------------ |
| src/            | Application source code                                      |
| src/aa.ts       | aa.js implementation                                         |
| src/activity.ts | activity.js implementation                                   |
| src/amp.ts      | amp.js implementation                                        |
| src/cd.tsx      | cd.js implementaion                                          |
| src/vw.ts       | vw.js implementation                                         |
| src/rtg.ts      | rtg.js implementation                                        |
| src/css/        | style files                                                  |
| src/lib/        | Util function implementations for DOM, logger, URL and so on |
| src/tag/        | Implementations main logics for each js file                 |
| src/abtest/     | Sample code for A/B test                                     |
| src/admock/     | Mock implementations for testing                             |
| src/tests/      | Unit test code                                               |
| template/       | HTML template files for local server and E2E testing         |
| cypress/        | E2E test code                                                |
| docs            | Documentations                                               |
| types/          | Type definitions                                             |
