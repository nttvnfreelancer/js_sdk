# Quick guide for RDN Tag

RDN Tag is a javascript file for servering ads from RDN.

To install the script, please paste the following `<script>` tag before `</body>` tag.

- For Staging.

```html
<script src="https://stg-s-cdn.rmp.rakuten.co.jp/js/aa.js" async></script>
```

- For Production.

```html
<script src="https://s-cdn.rmp.rakuten.co.jp/js/aa.js" async></script>
```

## Basic usage

Here is the basic format for displaying a simple banner ad.

```html
<div id="{AD_HTML_ELEMENT_ID}"></div>
<script>
  var rdntag = rdntag || {};
  rdntag.cmd = rdntag.cmd || [];
  rdntag.cmd.push(function () {
    rdntag.defineAd({ AD_SPOT_ID }, '{AD_HTML_ELEMENT_ID}');
    rdntag.display('{AD_HTML_ELEMENT_ID}');
  });
</script>
```

where

- `{AD_HTML_ELEMENT_ID}` is the ID of a HTML element which is used for displaying advertisments. It can be any string but required to be unique within every single pages.
- `{AD_SPOT_ID}` is the ID of a ad spot which is issued by Ad Server.

Example:

```html
<div id="rdn-adspot-274-58440529"></div>
<script>
  var rdntag = rdntag || {};
  rdntag.cmd = rdntag.cmd || [];
  rdntag.cmd.push(function () {
    rdntag.defineAd(274, 'rdn-adspot-274-58440529');
    rdntag.display('rdn-adspot-274-58440529');
  });
</script>
```

## Alternative to adspot

This `code` is used as alternative to adspot and it's converted to adspot at Ad Server

```html
<div id="{AD_HTML_ELEMENT_ID}"></div>
<script>
  var rdntag = rdntag || {};
  rdntag.cmd = rdntag.cmd || [];
  rdntag.cmd.push(function () {
    rdntag.defineAdCode({ CODE }, '{AD_HTML_ELEMENT_ID}');
    rdntag.display('{AD_HTML_ELEMENT_ID}');
  });
</script>
```

where

- `{CODE}` is the code used as mapping adspot and code at Ad Server.

Example:

```html
<div id="rdn-adspot-274-58440529"></div>
<script>
  var rdntag = rdntag || {};
  rdntag.cmd = rdntag.cmd || [];
  rdntag.cmd.push(function () {
    rdntag.defineAdCode('code123', 'rdn-code123-58440529');
    rdntag.display('rdn-code123-58440529');
  });
</script>
```

## Extra settings

### `SetGenre`

Use `setGenre(genreSettingObject)` to specify how to match a line item.

For more information about all fields within `genreSettingObject`, please see [Content MatchDelivery](https://confluence.rakuten-it.com/confluence/display/GADP/Content+Match+Delivery)

Example:

```html
<div id="rdn-adspot-274-58440529"></div>
<script>
  var rdntag = rdntag || {};
  rdntag.cmd = rdntag.cmd || [];
  rdntag.cmd.push(function () {
    rdntag.defineAd(274, 'rdn-adspot-274-58440529').setGenre({
      master_id: 1,
      code: '100371',
      match: 'children',
    });
    rdntag.display('rdn-adspot-274-58440529');
  });
</script>
```

### `SetIFA`

You can use `setIFA(ifa)` to specify a IFA of a mobile device to send to Ad Server.

> [!NOTE]  
> It would only work on iOS and Android device, and the value would be resolved as IDFA or ADID respectively.

Example:

```html
<div id="rdn-adspot-274-58440529"></div>
<script>
  var rdntag = rdntag || {};
  rdntag.cmd = rdntag.cmd || [];
  rdntag.cmd.push(function () {
    rdntag.defineAd(274, 'rdn-adspot-274-58440529').setIFA('DUMMY_IFA');
    rdntag.display('rdn-adspot-274-58440529');
  });
</script>
```

### `SetRzCookie`

You can use `setRz(ifa)` to specify a RzCookie to send to Ad Server.

Example:

```html
<div id="rdn-adspot-274-58440529"></div>
<script>
  var rdntag = rdntag || {};
  rdntag.cmd = rdntag.cmd || [];
  rdntag.cmd.push(function () {
    rdntag.defineAd(274, 'rdn-adspot-274-58440529').setRz('DUMMY_RzCookie');
    rdntag.display('rdn-adspot-274-58440529');
  });
</script>
```

### `SetEmail` / `SetHashedEmail`

You can use `setEmail('test@example.com')` to specify an email that will be immediately hashed and
then send to the AdServer. If you already have a hashed version of the email you can use
`setHashedEmail` instead.

Example:

```html
<div id="rdn-adspot-274-58440529"></div>
<script>
  var rdntag = rdntag || {};
  rdntag.cmd = rdntag.cmd || [];
  rdntag.cmd.push(function () {
    rdntag
      .defineAd(274, 'rdn-adspot-274-58440529')
      .setEmail('test@example.com');
    rdntag.display('rdn-adspot-274-58440529');
  });
</script>
```

### `SetEasyId` / `SetHashedEasyId`

You can use `setEasyId('xxx')` to specify an easy ID that will be immediately hashed and
then send to the AdServer. If you already have a hashed version of the easy ID you can use
`setHashedEasyId` instead.

Example:

```html
<div id="rdn-adspot-274-58440529"></div>
<script>
  var rdntag = rdntag || {};
  rdntag.cmd = rdntag.cmd || [];
  rdntag.cmd.push(function () {
    rdntag.defineAd(274, 'rdn-adspot-274-58440529').setEasyId('DUMMY_EasyID');
    rdntag.display('rdn-adspot-274-58440529');
  });
</script>
```

### `SetTargeting`

You can use `setTargeting(key, value)` to specify a key-value mapping for each ad spot.

`setTargeting` can be chained to support multipe key-value pairs.

`value` can be of string or string array. All values will be casted to string arrays before sending to Ad Server.

Example:

```html
<div id="rdn-adspot-274-58440529"></div>
<script>
  var rdntag = rdntag || {};
  rdntag.cmd = rdntag.cmd || [];
  rdntag.cmd.push(function () {
    rdntag
      .defineAd(274, 'rdn-adspot-274-58440529')
      .setTargeting('k1', 'string type') /* string type */
      .setTargeting('k2', ['male', 'female']) /* string array */;
    rdntag.display('rdn-adspot-274-58440529');
  });
</script>
```

### `SetResponsive`

You can use `setResponsive(bool)` to specify if an ad spot responsive or not.

Example:

```html
<div id="rdn-adspot-274-58440529"></div>
<script>
  var rdntag = rdntag || {};
  rdntag.cmd = rdntag.cmd || [];
  rdntag.cmd.push(function () {
    rdntag
      .defineAd(274, 'rdn-adspot-274-58440529')
      .setResponsive(true) /* make the ad responsive */;
    rdntag.display('rdn-adspot-274-58440529');
  });
</script>
```

If you want to adjust padding, padding element should be included in runa tag.

```html
<div id="rdn-adspot-274-58440529" style="padding:10px 30px;"></div>
```

### `SetBlockedAdvertiser`

`setBlockedAdvertiser([]number)` filters blacklist of advertiserID

Example:

```html
<script>
  var badv = [];
</script>

<div id="rdn-adspot-274-58440529"></div>
<script>
  var rdntag = rdntag || {};
  rdntag.cmd = rdntag.cmd || [];
  rdntag.cmd.push(function () {
    rdntag.defineAd(274, 'rdn-adspot-274-58440529').setBlockedAdvertiser(badv);
    rdntag.display('rdn-adspot-274-58440529');
  });
  document
    .getElementById('rdn-adspot-274-58440529')
    .addEventListener('slotResponseReceived', function (e) {
      if (e && e.detail && e.detail.adReturned && e.detail.advID) {
        badv.push(e.detail.advID);
      }
    });
</script>
```

### `SetRPoint`

You can use `setRPoint(number)` to specify users's rakuten point.

Example:

```html
<div id="rdn-adspot-274-58440529"></div>
<script>
  var rdntag = rdntag || {};
  rdntag.cmd = rdntag.cmd || [];
  rdntag.cmd.push(function () {
    rdntag.defineAd(274, 'rdn-adspot-274-58440529').setRPoint(1234);
    rdntag.display('rdn-adspot-274-58440529');
  });
</script>
```

### `SetAdspotBranchId`

You can use `setAdspotBranchId(number)` to specify adspot branch ID.  
adspot_branc_id should be in the range 1-20.

Example:

```html
<div id="rdn-adspot-274-58440529"></div>
<script>
  var rdntag = rdntag || {};
  rdntag.cmd = rdntag.cmd || [];
  rdntag.cmd.push(function () {
    rdntag.defineAd(274, 'rdn-adspot-274-58440529').setAdspotBranchId(1);
    rdntag.display('rdn-adspot-274-58440529');
  });
</script>
```

### `SetDebug`

You can use `setDebug(bool)` to specify if an ad spot is for debug purpose or not.

If an ad spot is in debug mode, Ad Server would log extra debug information.

Example:

```html
<div id="rdn-adspot-274-58440529"></div>
<script>
  var rdntag = rdntag || {};
  rdntag.cmd = rdntag.cmd || [];
  rdntag.cmd.push(function () {
    rdntag.defineAd(274, 'rdn-adspot-274-58440529').setDebug(true);
    rdntag.display('rdn-adspot-274-58440529');
  });
</script>
```

### `SetFlexible`

You can use `setFlexible(bool)` to specify if an ad spot flexible or not.
An ad is resized with the actual size of the content depending on the screen or the parent element, regardless of the size of the adspot.

Example:

```html
<div id="rdn-adspot-274-58440529"></div>
<script>
  var rdntag = rdntag || {};
  rdntag.cmd = rdntag.cmd || [];
  rdntag.cmd.push(function () {
    rdntag
      .defineAd(274, 'rdn-adspot-274-58440529')
      .setFlexible(true) /* make the ad flexible */;
    rdntag.display('rdn-adspot-274-58440529');
  });
</script>
```

### `Add callback event`

Ad display status can be found by call back event.

#### slotResponseReceived event

- event object

```javascript
  detail: {
    adReturned: true,
    status: 'succeeded'
  }
```

    - adReturned: boolean
        - true:  ad is displayed, status is always 'succeeded'
        - false: ad is not displayed, status is 'unfilled' or 'failed'
    - status: string
        - succeeded: ad is displayed
        - unfilled:  ad is not displayed because response is unfilled
        - failed: ad is not displayed because https status in response is not 200

Example:

```html
<div id="rdn-adspot-274-58440529"></div>
<script>
  var rdntag = rdntag || {};
  rdntag.cmd = rdntag.cmd || [];
  rdntag.cmd.push(function () {
    rdntag.defineAd(274, 'rdn-adspot-274-58440529');
    rdntag.display('rdn-adspot-274-58440529');
  });
  document
    .getElementById('rdn-adspot-274-58440529')
    .addEventListener('slotResponseReceived', function (e) {
      console.log(
        'slotResponseReceived event is called:',
        e.detail.adReturned,
        e.detail.status
      );
      if (e && e.detail && e.detail.adReturned) {
        console.log('ad is displayed');
      }
    });
</script>
```

## Single Request

You can send Ad request of multiple adspots at once with Single Request feature.
When you call `displayWithSingleRequest()`, The request will be sent to the server with ads that are defined before `displayWithSingleRequest()`.

Example:

```html
<div id="adspot-1"></div>
<div id="adspot-2"></div>
<script>
  var rdntag = rdntag || {};
  rdntag.cmd = rdntag.cmd || [];
  rdntag.cmd.push(function () {
    rdntag.defineAd(1, 'adspot-1').enableSingleRequest();
    rdntag.defineAd(2, 'adspot-2').enableSingleRequest();
    rdntag.displayWithSingleRequest();
  });
</script>
```

## Lazy Loading

Lazy loading enables pages to load faster, reduces resource consumption and contention, and improves viewability rate by pausing the requesting of ads until they approach the user's viewport.
If it would be used with Single Request, the first ad in the group would be used as a trigger of fetching.

Notes:
It doesn't work in iframe tags with cross-origin like GAM.
If you want to use lazy loading in them, you should use lazy loading function they have.

Example:

```html
<div id="lazy-load-1"></div>
<script>
  var rdntag = rdntag || {};
  rdntag.cmd = rdntag.cmd || [];
  rdntag.cmd.push(function () {
    // Fetches ads within 2 viewports.
    rdntag.enableLazyLoad(200);
    rdntag.defineAd(1, 'lazy-load-1');
    rdntag.display('lazy-load-1');
  });
</script>
```

## In Single Page Applications

You have to require some customization in SPA frameworks(React, Vue, etc.)
We will present an approach in React and Vue.

Please load our JS SDK in your app's entrypoint html file.

```html
<script src="https://s-cdn.rmp.rakuten.co.jp/js/aa.js" async></script>
```

You can call functions to define and show ads after mounted DOM.

### React

```js
function ExamplePage() {
  useEffect(() => {
    const { rdntag } = window;
    if (rdntag && Object.keys(rdntag) !== 0) {
      rdntag.defineAd(1, 'adspot-1');
      rdntag.display('adspot-1');
    }
  }, []);

  return <div id="adspot-1"></div>;
}
```

### Vue.js (v3)

```js
<template>
  <div id="adspot-1"></div>
</template>

<script>
import { onMounted } from "vue";

export default {
  name: "Ad",
  setup() {
    onMounted(() => {
      const { rdntag } = window;
      if (rdntag && Object.keys(rdntag) !== 0) {
        rdntag.defineAd(1, "adspot-1");
        rdntag.display("adspot-1");
      }
    });
  },
};
```

## Carousel Mode

RUNA provides carousel advertising. If ads you defined are in the wrapper the id of which is specified in `displayInCarousel()`, they would be shown carousel ads.
Because This feature is an extension of Single Request, You need to put `enableSingleRequest()` to every Ad definitions.

### options

You can customize some appearances and behaviors with object as the secound argument in `displayInCarousel()`.

| Name             | Type              | Default | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------- | ----------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| width            | number            | 100%    | The size of carousel(px)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| margin           | number            | 0       | Margins between ads(px)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| loop             | boolean           | false   | Set to `true` to enable continuous loop mode                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| freeMode         | boolean           | false   | Enables free mode functionality. It provides a plain scroll carousel.<br />You can't use `loop`, `navigation`, and `pagination` options in `freeMode`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| nextMinSlideRate | number            | 0       | If an only one Ad will be shown in the carousel because of the combination of the wrapper size and ad size, JS SDK resize Ads to show two Ads at least. You can specify how percentage of the width of next ads is displayed.                                                                                                                                                                                                                                                                                                                                                                                                                       |
| responsive       | boolean           | false   | Resize each slide to fit the size of the wrapper of carousel                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| centering        | boolean           | false   | centralize the first slide and the last slide                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| navigation       | boolean \| object | false   | Enables navigation. You can specify some options with object or `true` to enable with default settings.<br /><b>Navigation Options</b><pre>{<br /> color: "#8e24aa", // Color code or name defined in CSS<br /> size: "96px" // Unit define in CSS <br /> type: "svg", // The type of arrows. "text" and "svg" are available.<br /> theme: "circle", // The theme of arrows. "shadow" and "circle" are available. This option doesn't work when type is "text". <br /> hoverHighlight: true // Arrows are highlighted when the cursor is hovered on them. This option is available only when you specify hex color for "color" option.<br />}</pre> |
| pagination       | boolean \| object | false   | Enables pagination. You can specify some options with object or `true` to enable with default settings.<br /><b>Pagination Options</b><pre>{ <br /> color: "#8e24aa", // Color code or name defined in CSS<br /> size: "10px", // Size of bullets, default "8px"<br /> position: "outside" // Specify "inside" or "outside", default "inside" <br />}</pre>                                                                                                                                                                                                                                                                                         |

```html
<div id="carousel-1">
  <div id="adspot-1"></div>
  <div id="adspot-2"></div>
</div>
<script>
  var rdntag = rdntag || {};
  rdntag.cmd = rdntag.cmd || [];
  rdntag.cmd.push(function () {
    rdntag.defineAd(1, 'adspot-1').enableSingleRequest();
    rdntag.defineAd(2, 'adspot-2').enableSingleRequest();

    rdntag.displayInCarousel('carousel-1', {
      margin: 15,
      nextMinSlideRate: 0.1,
      responsive: true,
      navigation: true,
      pagination: {
        color: '#8e24aa',
      },
    });
  });
</script>
```
