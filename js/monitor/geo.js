/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Geodesy representation conversion functions (c) Chris Veness 2002-2010                        */
/*   - www.movable-type.co.uk/scripts/latlong.html                                                */
/*                                                                                                */
/*  Sample usage:                                                                                 */
/*    var lat = Geo.parseDMS('51° 28′ 40.12″ N');                                                 */
/*    var lon = Geo.parseDMS('000° 00′ 05.31″ W');                                                */
/*    var p1 = new LatLon(lat, lon);                                                              */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

var Geo = {};  // Geo namespace, representing static class

/**
 * Parses string representing degrees/minutes/seconds into numeric degrees
 *
 * This is very flexible on formats, allowing signed decimal degrees, or deg-min-sec optionally
 * suffixed by compass direction (NSEW). A variety of separators are accepted (eg 3º 37' 09"W) 
 * or fixed-width format without separators (eg 0033709W). Seconds and minutes may be omitted. 
 * (Note minimal validation is done).
 *
 * @param   {String|Number} dmsStr: Degrees or deg/min/sec in variety of formats
 * @returns {Number} Degrees as decimal number
 * @throws  {TypeError} dmsStr is an object, perhaps DOM object without .value?
 */
Geo.parseDMS = function(dmsStr) {
  if (typeof deg == 'object') throw new TypeError('Geo.parseDMS - dmsStr is [DOM?] object');
  
  if (!isNaN(dmsStr)) return Number(dmsStr);  // ... signed decimal degrees without NSEW
  
  // strip off any sign or compass dir'n & split out separate d/m/s
  var dms = String(dmsStr).trim().replace(/^-/,'').replace(/[NSEW]$/i,'').split(/[^0-9.,]+/);
  if (dms[dms.length-1]=='') dms.splice(dms.length-1);  // from trailing symbol
  
  if (dms == '') return NaN;
  
  // and convert to decimal degrees...
  switch (dms.length) {
    case 3:  // interpret 3-part result as d/m/s
      var deg = dms[0]/1 + dms[1]/60 + dms[2]/3600; 
      break;
    case 2:  // interpret 2-part result as d/m
      var deg = dms[0]/1 + dms[1]/60; 
      break;
    case 1:  // just d (possibly decimal) or non-separated dddmmss
      var deg = dms[0];
      // check for fixed-width unseparated format eg 0033709W
      if (/[NS]/i.test(dmsStr)) deg = '0' + deg;  // - normalise N/S to 3-digit degrees
      if (/[0-9]{7}/.test(deg)) deg = deg.slice(0,3)/1 + deg.slice(3,5)/60 + deg.slice(5)/3600; 
      break;
    default:
      return NaN;
  }
  if (/^-|[WS]$/i.test(dmsStr.trim())) deg = -deg; // take '-', west and south as -ve
  return Number(deg);
}

/**
 * Convert decimal degrees to deg/min/sec format
 *  - degree, prime, double-prime symbols are added, but sign is discarded, though no compass
 *    direction is added
 *
 * @private
 * @param   {Number} deg: Degrees
 * @param   {String} [format=dms]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to use - default 0 for dms, 2 for dm, 4 for d
 * @returns {String} deg formatted as deg/min/secs according to specified format
 * @throws  {TypeError} deg is an object, perhaps DOM object without .value?
 */
Geo.toDMS = function(deg, format, dp) {
  if (typeof deg == 'object') throw new TypeError('Geo.toDMS - deg is [DOM?] object');
  if (isNaN(deg)) return '';  // give up here if we can't make a number from deg
  
    // default values
  if (typeof format == 'undefined') format = 'dms';
  if (typeof dp == 'undefined') {
    switch (format) {
      case 'd': dp = 4; break;
      case 'dm': dp = 2; break;
      case 'dms': dp = 0; break;
      default: format = 'dms'; dp = 0;  // be forgiving on invalid format
    }
  }
  
  deg = Math.abs(deg);  // (unsigned result ready for appending compass dir'n)
  
  switch (format) {
    case 'd':
      d = deg.toFixed(dp);     // round degrees
      if (d<100) d = '0' + d;  // pad with leading zeros
      if (d<10) d = '0' + d;
      dms = d + '\u00B0';      // add º symbol
      break;
    case 'dm':
      var min = (deg*60).toFixed(dp);  // convert degrees to minutes & round
      var d = Math.floor(min / 60);    // get component deg/min
      var m = (min % 60).toFixed(dp);  // pad with trailing zeros
      if (d<100) d = '0' + d;          // pad with leading zeros
      if (d<10) d = '0' + d;
      if (m<10) m = '0' + m;
      dms = d + '\u00B0' + m + '\u2032';  // add º, ' symbols
      break;
    case 'dms':
      var sec = (deg*3600).toFixed(dp);  // convert degrees to seconds & round
      var d = Math.floor(sec / 3600);    // get component deg/min/sec
      var m = Math.floor(sec/60) % 60;
      var s = (sec % 60).toFixed(dp);    // pad with trailing zeros
      if (d<100) d = '0' + d;            // pad with leading zeros
      if (d<10) d = '0' + d;
      if (m<10) m = '0' + m;
      if (s<10) s = '0' + s;
      dms = d + '\u00B0' + m + '\u2032' + s + '\u2033';  // add º, ', " symbols
      break;
  }
  
  return dms;
}

/**
 * Convert numeric degrees to deg/min/sec latitude (suffixed with N/S)
 *
 * @param   {Number} deg: Degrees
 * @param   {String} [format=dms]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to use - default 0 for dms, 2 for dm, 4 for d
 * @returns {String} Deg/min/seconds
 */
Geo.toLat = function(deg, format, dp) {
  var lat = Geo.toDMS(deg, format, dp);
  return lat=='' ? '' : lat.slice(1) + (deg<0 ? 'S' : 'N');  // knock off initial '0' for lat!
}

/**
 * Convert numeric degrees to deg/min/sec longitude (suffixed with E/W)
 *
 * @param   {Number} deg: Degrees
 * @param   {String} [format=dms]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to use - default 0 for dms, 2 for dm, 4 for d
 * @returns {String} Deg/min/seconds
 */
Geo.toLon = function(deg, format, dp) {
  var lon = Geo.toDMS(deg, format, dp);
  return lon=='' ? '' : lon + (deg<0 ? 'W' : 'E');
}

/**
 * Convert numeric degrees to deg/min/sec as a bearing (0º..360º)
 *
 * @param   {Number} deg: Degrees
 * @param   {String} [format=dms]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to use - default 0 for dms, 2 for dm, 4 for d
 * @returns {String} Deg/min/seconds
 */
Geo.toBrng = function(deg, format, dp) {
  deg = (Number(deg)+360) % 360;  // normalise -ve values to 180º..360º
  var brng =  Geo.toDMS(deg, format, dp);
  return brng.replace('360', '0');  // just in case rounding took us up to 360º!
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */






/* 
 * Calculate geodesic distance (in m) between two points specified by latitude/longitude  
 * (in numeric degrees) using Vincenty inverse formula for ellipsoids 
 */ 
function distVincenty(lat1, lon1, lat2, lon2) { 
  var a = 6378137, b = 6356752.3142,  f = 1/298.257223563;  // WGS-84 ellipsiod 
  var L = (lon2-lon1).toRad(); 
  var U1 = Math.atan((1-f) * Math.tan(lat1.toRad())); 
  var U2 = Math.atan((1-f) * Math.tan(lat2.toRad())); 
  var sinU1 = Math.sin(U1), cosU1 = Math.cos(U1); 
  var sinU2 = Math.sin(U2), cosU2 = Math.cos(U2); 
   
  var lambda = L, lambdaP, iterLimit = 100; 
  do { 
    var sinLambda = Math.sin(lambda), cosLambda = Math.cos(lambda); 
    var sinSigma = Math.sqrt((cosU2*sinLambda) * (cosU2*sinLambda) +  
      (cosU1*sinU2-sinU1*cosU2*cosLambda) * (cosU1*sinU2-sinU1*cosU2*cosLambda)); 
    if (sinSigma==0) return 0;  // co-incident points 
    var cosSigma = sinU1*sinU2 + cosU1*cosU2*cosLambda; 
    var sigma = Math.atan2(sinSigma, cosSigma); 
    var sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma; 
    var cosSqAlpha = 1 - sinAlpha*sinAlpha; 
    var cos2SigmaM = cosSigma - 2*sinU1*sinU2/cosSqAlpha; 
    if (isNaN(cos2SigmaM)) cos2SigmaM = 0;  // equatorial line: cosSqAlpha=0 (§6) 
    var C = f/16*cosSqAlpha*(4+f*(4-3*cosSqAlpha)); 
    lambdaP = lambda; 
    lambda = L + (1-C) * f * sinAlpha * 
      (sigma + C*sinSigma*(cos2SigmaM+C*cosSigma*(-1+2*cos2SigmaM*cos2SigmaM))); 
  } while (Math.abs(lambda-lambdaP) > 1e-12 && --iterLimit>0); 
 
  if (iterLimit==0) return NaN  // formula failed to converge 
 
  var uSq = cosSqAlpha * (a*a - b*b) / (b*b); 
  var A = 1 + uSq/16384*(4096+uSq*(-768+uSq*(320-175*uSq))); 
  var B = uSq/1024 * (256+uSq*(-128+uSq*(74-47*uSq))); 
  var deltaSigma = B*sinSigma*(cos2SigmaM+B/4*(cosSigma*(-1+2*cos2SigmaM*cos2SigmaM)- 
    B/6*cos2SigmaM*(-3+4*sinSigma*sinSigma)*(-3+4*cos2SigmaM*cos2SigmaM))); 
  var s = b*A*(sigma-deltaSigma); 
   
  s = s.toFixed(3); // round to 1mm precision 
  return s; 
} 
 
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */ 
 
/* 
 * extend String object with method for parsing degrees or lat/long values to numeric degrees 
 * 
 * this is very flexible on formats, allowing signed decimal degrees, or deg-min-sec suffixed by  
 * compass direction (NSEW). A variety of separators are accepted (eg 3º 37' 09"W) or fixed-width  
 * format without separators (eg 0033709W). Seconds and minutes may be omitted. (Minimal validation  
 * is done). 
 */ 
String.prototype.parseDeg = function() { 
  if (!isNaN(this)) return Number(this);                 // signed decimal degrees without NSEW 
 
  var degLL = this.replace(/^-/,'').replace(/[NSEW]/i,'');  // strip off any sign or compass dir'n 
  var dms = degLL.split(/[^0-9.]+/);                     // split out separate d/m/s 
  for (var i in dms) if (dms[i]=='') dms.splice(i,1);    // remove empty elements (see note below) 
  switch (dms.length) {                                  // convert to decimal degrees... 
    case 3:                                              // interpret 3-part result as d/m/s 
      var deg = dms[0]/1 + dms[1]/60 + dms[2]/3600; break; 
    case 2:                                              // interpret 2-part result as d/m 
      var deg = dms[0]/1 + dms[1]/60; break; 
    case 1:                                              // decimal or non-separated dddmmss 
      if (/[NS]/i.test(this)) degLL = '0' + degLL;       // - normalise N/S to 3-digit degrees 
      var deg = dms[0].slice(0,3)/1 + dms[0].slice(3,5)/60 + dms[0].slice(5)/3600; break; 
    default: return NaN; 
  } 
  if (/^-/.test(this) || /[WS]/i.test(this)) deg = -deg; // take '-', west and south as -ve 
  return deg; 
} 
// note: whitespace at start/end will split() into empty elements (except in IE) 
 
/* 
 * extend Number object with methods for converting degrees/radians 
*/ 
Number.prototype.toRad = function() {  // convert degrees to radians 
  return this * Math.PI / 180; 
}/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */


