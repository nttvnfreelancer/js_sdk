# Quick guide for RDN Viewability Tag

RUNA vw.js is a sub-component for measuring viewability of target HTML element.

## Usage

Here is the basic format for measuring viewability of the `div` element. `viewable` here means 50% of the ad's pixels are visible in the browser window for a continuous 1 second.

#### Install vw.js

please paste the following `<script>` tag to `<head>` tag basically.

- For Staging.

```html
<script src="https://stg-s-cdn.rmp.rakuten.co.jp/js/vw.js" async></script>
```

- For Production.

```html
<script src="https://s-cdn.rmp.rakuten.co.jp/js/vw.js" async></script>
```

#### Example1:

When `vw.js` is loaded after tag, the below pattern works.
However if only one tag is called, and running not asynchronously,`vw.js` can be loaded before tag. Because rdnviews variable is monitored and monitoring stops after value detected in rdnviews variable once.

```html
<div
  id="viewability-test-div"
  style="background-color:black;width:300px;height:250px;"
></div>
<script>
  window.rdnviews = window.rdnviews || [];
  window.rdnviews.push({
    el: document.getElementById('viewability-test-div'),
    inviewURL: 'https://example.com/inview',
  });
</script>
```

#### Example2:

When `vw.js` is loaded before tag, `rdnviewMount` function can be called.
And this pattern is expected when multiple tags are created asynchronously.

```html
<div
  id="viewability-test-div"
  style="background-color:black;width:300px;height:250px;"
></div>
<script>
  window.rdnviewMount(document.getElementById('viewability-test-div'), {
    inviewURL: 'https://example.com/inview',
  });
</script>
```

#### parameters

- `el` (required) is the element instance to be measured.
- `inviewURL` (required) is an endpoint to log if the element viewed or not. It'll only be triggered when the element is _measurable_ and _got viewed_. The response of it should also be an image beacon.
