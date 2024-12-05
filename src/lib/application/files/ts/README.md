<p align="center">
  <picture>
    <img src="https://ucarecdn.com/eac2c945-177d-4fc9-8bc1-fa2be48ad3a2/lotolab_golden.svg" height="100"/>
  </picture>
  <h4 align="center">
    The <%= name %> Project create Base on Tsai framework.
  </h4>
</p>

<p align="center">
  A progressive 
  <a href="http://nodejs.org" target="_blank">
  Node.js
  </a> framework for building efficient and scalable server-side applications.
</p>

<p align="center">
  <a href="https://www.npmjs.com/~tsailab" target="_blank"><img src="https://img.shields.io/npm/l/%40tsailab%2Fcli?color=%23FFDEAD&label=@tsai" alt="License" /></a>
  <a href="https://www.npmjs.com/~tsailab" target="_blank"><img src="https://img.shields.io/npm/v/@tsailab/cli.svg?label=TsaiCli" alt="Tsai cli" /></a>
  <a href="https://discord.gg/lotolab" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
  <a href="https://x.com/lamborghini171" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
  <a href="https://www.npmjs.com/~tsailab" target="_blank"><img src="https://img.shields.io/npm/dm/%40tsailab%2Fcli?style=flat&logoColor=%23FA0809" alt="Downloads" /></a>
</p>


## Description

[Tsai project Base on NestJS](https://github.com/tsai-plat/platform) framework TypeScript starter repository.

<%= description %>

## Project setup

```bash
$ <%= packageManager %> install
```

## Compile and run the project

```bash
# development
$ <%= packageManager %> run start

# watch mode
$ <%= packageManager %> run start:dev

# production mode
$ <%= packageManager %> run start:prod
```

## Run tests

```bash
# unit tests
$ <%= packageManager %> run test

# e2e tests
$ <%= packageManager %> run test:e2e

# test coverage
$ <%= packageManager %> run test:cov
```



## Deployment

When you're ready to deploy your monorepo application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [Deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ <%= packageManager %> install -g mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

### Dependencies Import

> Tsai monorepo project

```bash
# add an global project package
pnpm add <pkgname> -w
# Example: add package into spec package
pnpm --filter math-lib add -D typescript @types/lodash

# Support glob pattern
pnpm --filter pkg* run test
```


## Support

Tsai is an MIT-licensed open source project. It has grown thanks to the support of NestJS and its amazing backers.

## License

Tsai is [MIT licensed](https://github.com/tsai-plat/.github/blob/main/LICENSE).
