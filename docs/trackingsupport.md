# Quick guide for Tracking Support

Due to the third party cookie restriction, user id based tracking become more difficult in terms of conversion. When LP is non-rakuten.co.jp domain, Rz/Rp or anyother Rakuten cookie is not available on Safari and also will be same for Chrome in near future.
<br />
<br />
We support the method to get them in this situation.

## Usage

1. Set macros for encrypted easy_id and rp for a creative on RUNA UI
2. Put `activity.js` in the page the domain of which is not rakuten.co.jp that you specified as a click url for a creative

```html
<script src="https://s-cdn.rmp.rakuten.co.jp/js/activity.js" async></script>
```

3. Put `activity.js` in the conversion page

![image](https://github.com/rakuten-runa/rssp.js/assets/124035188/43c789db-48b5-48f5-9231-f8a00ccd6694)
