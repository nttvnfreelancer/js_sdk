# AB Test by tag
This example is to pick up one adspotID from candidates by RP cookie.

## define basic functions in advance
```
// Basic functions 
<script>
  const getRpCookie = function() {
    const cookies = document.cookie;
    const cookieList = cookies.split(';');
    for (let idx = 0, len = cookieList.length; idx < len; idx++) {
      let kv = cookieList[idx].split('=');
      if (kv[0].trim() == 'Rp') return kv[1];
    }
    return "";
  };

  const getHexFromRp = function() {
    const rp = getRpCookie();
    if (rp) return parseInt(rp.charAt(0), 16);
    return undefined;
  };

  const getIndexFromRatio = function(targetNumber, ratios) {
    const basedNumber = 16;
    if (!ratios || ratios.length == 0) return undefined;
    if (targetNumber >= basedNumber) return undefined; // invalid targetNumber      
    const sum = ratios.reduce(function(a, x) { return a + x; });

    // sum should be equal to this._basedNumber or less then this._basedNumber
    if (sum > this._basedNumber) return undefined;

    let calculated = 0;
    for (let idx = 0, len = ratios.length; idx < len; idx++) {
      const target = Math.round((basedNumber / sum) * ratios[idx]);
      calculated += target;
      if (idx + 1 == ratios.length) calculated = basedNumber;
      if (targetNumber < calculated) return idx;
    }
    return undefined;      
  };
</script>
```
1. getRpCookie()
    - returns value of RP cookie if existing. it returns `undefined` when no RP cookie
2. getHexFromRp()
    - returns decimal number converted from hex of first letter of RP cookie 
3. getIndexFromRatio()
    - returns target index of list, or undefined if invalid parameter is passed
    - e.g. call like `getIndexFromRatio(5, [1,1,2])`
    - sum of list is recommended to be 16 or divisor of 16 to work set ratio perfectly
    - if list is like `[1,4]`, actual ratio would be `3:13` due to hex based grouping


## how to pick up one adspotID from candidates
```
<script>
  // 1.definition of candidate adspotIDs
  const candidateAdspotIDs = [1, 3, 6];
  const noRPAdspotID = 7;

  // 2. get RP cookie
  let dec = getHexFromRp();
  let adspotID = noRPAdspotID;
  if (dec) {
    // 3. get target index from ratio
    let idx = getIndexFromRatio(dec, [1,1,2]);
    if (idx !== undefined) adspotID = candidateAdspotIDs[idx];
  }
</script>

<script>
  var rdntag = rdntag || {};
  rdntag.cmd = rdntag.cmd || [];
  rdntag.cmd.push(function() {
    rdntag.defineAd(adspotID, 'adspot-10');
    rdntag.display('adspot-10');
  });
</script>
```

## how to pick up one adspotCode from candidates
```
<script>
  // 1.definition of candidate adspotCodes
  const candidateAdspotCodes = ['aaa', 'bbb', 'ccc'];
  const noRPAdspotCode = 'ddd';

  // 2. get RP cookie
  let dec = getHexFromRp();
  let adspotCode = noRPAdspotID;
  if (dec) {
    // 3. get target index from ratio
    let idx = getIndexFromRatio(dec, [1,1,2]);
    if (idx !== undefined) adspotCode = candidateAdspotCodes[idx];
  }
</script>

<script>
  var rdntag = rdntag || {};
  rdntag.cmd = rdntag.cmd || [];
  rdntag.cmd.push(function() {
    rdntag.defineAdCode(adspotCode, 'adspot-code');
    rdntag.display('adspot-code');
  });  
</script>
```

