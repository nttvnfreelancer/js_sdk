# AMP development

## Overview

AMP AD is composed of 3 elements.

1. Amp OpenSource project [amphtml](https://github.com/ampproject/amphtml)
   - Our code is also integrated in as [rakutenunifiedads](https://github.com/ampproject/amphtml/blob/master/ads/vendors/rakutenunifiedads.md)
2. [amp.js](https://github.rakops.com/gatd/rssp.js/blob/release-11/src/amp.ts)
   - Part of RUNA SDK
   - This is called from amp-ad.js (part of amphtml)
3. aa.js
   - This is called by amp.js which generates script element dynamically. Then it runs same as normal RUNA tag

### Amp OpenSource project

Our code has name `Rakuten Unified Ads` as identification

- [docs](https://github.com/ampproject/amphtml/blob/master/ads/vendors/rakutenunifiedads.md)
- [code](https://github.com/ampproject/amphtml/blob/master/ads/vendors/rakutenunifiedads.js)

`rakutenunifiedads.js` is integrated into part of amphtml. So if changes are required, Pull Request should be sent.
However what `rakutenunifiedads.js` does is purely simple, just passing data attributes as `runa` object to our amp.js. Changes would rarely happen.

### amp.js in RUNA SDK

- render runa tag like inside html
- window.runa is passed from amp-ad.js of amphtml which includes rakutenunifiedads.js
- window.runa has some properties as string type. So type assertion is required here
- about naming rule for data attribute when adding new one which requires separation
  - e.g. data attribute `data-hashed_email` passes value as property `hashed_email`
  - `_` should be used as delimiter, not `-`

### amp data attribute list

| data attribute        | functionality                         | relevant attribute      | relevant set function         |
| :-------------------- | :------------------------------------ | :---------------------- | :---------------------------- |
| data-id               |                                       | id attribute in div tag |                               |
| data-env              | environment for aa.js (dev, stg, prd) |                         |                               |
| data-iscode           | use code instead of adspot id         |                         | rdntag.defineAdCode()         |
| data-genre            | set genre                             |                         | rdntag.setGenre()             |
| data-targeting        | set targeting                         |                         | rdntag.setTargeting()         |
| data-ifa              | set ifa                               |                         | rdntag.setIFA()               |
| data-rzcookie         | set rz cookie                         |                         | rdntag.setRz()                |
| data-email            | set email                             |                         | rdntag.setEmail()             |
| data-hashed_email     | set hashed email                      |                         | rdntag.setHashedEmail()       |
| data-easyid           | set easy id                           |                         | rdntag.setEasyId()            |
| data-hashed_easyid    | set hashed easy id                    |                         | rdntag.setHashedEasyId()      |
| data-advids           | set blocked advertiser id             |                         | rdntag.setBlockedAdvertiser() |
| data-rpoint           | set user's rakuten point              |                         | rdntag.setRPoint()            |
| data-adspot_branch_id | set adspot branch id                  |                         | rdntag.setAdspotBranchId()    |

## AMP HTML sample

```
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Amp Ad Example</title>
    <link rel="canonical" href="http://nonblocking.io/">
    <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
    <link href='https://fonts.googleapis.com/css?family=Questrial' rel='stylesheet' type='text/css'>
    <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
    <script async src="https://cdn.ampproject.org/v0.js"></script>
    <script async custom-element="amp-ad" src="https://cdn.ampproject.org/v0/amp-ad-0.1.js"></script>
  </head>
  <body>
    <h2>rakutenunifiedads amp tag</h2>
      <amp-ad
      width="300"
      height="250"
      type="rakutenunifiedads"
      layout="responsive"
      data-id="63"
      data-env="dev"
      data-targeting='{"k1":"dummy-key","k2":["male", "female"]}'
      data-genre='{"master_id":1,"code":"100371","match":"children"}'
      data-ifa="DUMMY_IFA"
      data-rzcookie="rz-cookie"
      data-email="runaruna@rakuten.com"
      data-hashed_email="hashedemail@rakuten.com"
      data-easyid="easyid"
      data-hashed_easyid="hashedeasyid"
      data-advids="1,2,3,4,5"
      data-rpoint=1234
      data-adspot_branch_id=1
    >
      <div placeholder>
          <p>placeholder</p>
      </div>
      <div fallback>
          <p>fallback</p>
      </div>
    </amp-ad>
  </body>
</html>
```

## For developer

### How to send PR to amphtml

1. You need to join in [Rakuten, Inc](https://github.com/rakuten-ads)
2. Clone amphtml forked repository [rakuten-ads/amphtml](https://github.com/rakuten-ads/amphtml).
3. Add upstream `https://github.com/ampproject/amphtml.git` in cloned directory

```
origin	git@github.com:rakuten-ads/amphtml.git (fetch)
origin	git@github.com:rakuten-ads/amphtml.git (push)
upstream	https://github.com/ampproject/amphtml.git (fetch)
upstream	https://github.com/ampproject/amphtml.git (push)
```

4. Update [rakuten-ads/amphtml] branch latest

```
git fetch upstream
git checkout master
git merge upstream/master
git push -u origin master
```

5. Modify code if needed and push them to origin repository
6. Send PR from original [amphtml](https://github.com/ampproject/amphtml)

### How to develop amphtml and run on local

1. cd [rakuten-ads/amphtml](https://github.com/rakuten-ads/amphtml) directory
2. `nmp install`
3. install `gulp` if not installed
4. `gulp build`
5. `gulp serve`
6. access `http://localhost:8000/examples/amp-ad/ads.amp.html?type=rakutenunifiedads`
