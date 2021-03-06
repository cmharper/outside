/* jshint esversion: 6 */
/* jshint multistr: true */
// useful sites
// https://github.com/strikeentco/feels
// https://github.com/mourner/suncalc
// https://stackoverflow.com/a/5671172 -> magic to calculate the seasons

const SCALE_TEMPERATURE = chroma.scale(["#000413", "#072275", "#7e8cb7", "#f4f5f9", "#fed664", "#ffa447", "#f36233", "#d92332"]).domain([-30, -20, -10, 0, 15, 25, 30, 36]);
const SCALE_UV = chroma.scale([ "#757575", "#41aa48", "#fae300", "#f37721", "#e22426", "#a289bf"]).domain([2, 4, 6, 8, 10, 12]);
const SCALE_OZONE = chroma.scale(["#ffff00", "#fbcb01", "#ff7300", "#ff0000"]).domain([100, 160, 240, 241]);
const ICONS = [ "clear-day", "clear-night", "rain", "snow", "sleet", "wind", "fog", "cloudy", "partly-cloudy-day", "partly-cloudy-night" ];
const AVAILABLE = ["time", "temperature", "humidity", "battery", "summary", "icon", "temp", "pressure", "wind", "gust", "direction", "cloud_cover", "uv", "visibility", "ozone"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const LOCALTIME = new Intl.DateTimeFormat('en-GB', {
	year: 'numeric', month: 'long', day: 'numeric',
	hour: 'numeric', minute: 'numeric', second: 'numeric',
	hour12: false,
	timeZone: 'Europe/London'
});
const LOCATIONS = ["Nailsea", "Chitterne"];
// const LOCATIONS = ["Chitterne"];
var LAST_UPDATED = [];
for (var l in LOCATIONS) { LAST_UPDATED[LOCATIONS[l]] = null; }
var ss, chroma, SunCalc, Skycons, Feels;
var BACKGROUND_COLOURS = {};

Date.fromJulian = function (j) {
	j = (+j) + (30.0 / (24 * 60 * 60));
	var A = Date.julianArray(j, true);
	return new Date(Date.UTC.apply(Date, A));
};

Date.julianArray = function (j, n) {
	var F = Math.floor;
	var j2, JA, a, b, c, d, e, f, g, h, z;
	j += 0.5;
	j2 = (j - F(j)) * 86400.0;
	z = F(j);
	f = j - z;
	if (z < 2299161) a = z;
	else {
		g = F((z - 1867216.25) / 36524.25);
		a = z + 1 + g - F(g / 4);
	}
	b = a + 1524;
	c = F((b - 122.1) / 365.25);
	d = F(365.25 * c);
	e = F((b - d) / 30.6001);
	h = F((e < 14) ? (e - 1) : (e - 13));
	JA = [F((h > 2) ? (c - 4716) : (c - 4715)),	h - 1, F(b - d - F(30.6001 * e) + f)];
	var JB = [F(j2 / 3600), F((j2 / 60) % 60), Math.round(j2 % 60)];
	JA = JA.concat(JB);
	if (typeof n == "number") return JA.slice(0, n);
	return JA;
};

Date.getSeasons = function (y, wch) {
	y = y || new Date().getUTCFullYear();
	if (y < 1000 || y > 3000) throw y + " is out of range";
	var Y1 = (y - 2000) / 1000;
	var Y2 = Y1 * Y1;
	var Y3 = Y2 * Y1;
	var Y4 = Y3 * Y1;
	var jd, t, w, d;
	var est = 0;
	var i = 0;
	var Cos = Math.degCos;
	var A = [y];
	var e1 = [485, 203, 199, 182, 156, 136, 77, 74, 70, 58, 52, 50, 45, 44, 29, 18, 17, 16, 14, 12, 12, 12, 9, 8];
	var e2 = [324.96, 337.23, 342.08, 27.85, 73.14, 171.52, 222.54, 296.72, 243.58, 119.81, 297.17, 21.02, 247.54, 325.15, 60.93, 155.12, 288.79, 198.04, 199.76, 95.39, 287.11, 320.81, 227.73, 15.45];
	var e3 = [1934.136, 32964.467, 20.186, 445267.112, 45036.886, 22518.443, 65928.934, 3034.906, 9037.513, 33718.147, 150.678, 2281.226, 29929.562, 31555.956, 4443.417, 67555.328, 4562.452, 62894.029, 31436.921, 14577.848, 31931.756, 34777.259, 1222.114, 16859.074];
	while (i < 4) {
		switch (i) {
		case 0:
			jd = 2451623.80984 + 365242.37404 * Y1 + 0.05169 * Y2 - 0.00411 * Y3 - 0.00057 * Y4;
			break;
		case 1:
			jd = 2451716.56767 + 365241.62603 * Y1 + 0.00325 * Y2 + 0.00888 * Y3 - 0.00030 * Y4;
			break;
		case 2:
			jd = 2451810.21715 + 365242.01767 * Y1 - 0.11575 * Y2 + 0.00337 * Y3 + 0.00078 * Y4;
			break;
		case 3:
			jd = 2451900.05952 + 365242.74049 * Y1 - 0.06223 * Y2 - 0.00823 * Y3 + 0.00032 * Y4;
			break;
		}
		t = (jd - 2451545.0) / 36525;
		w = 35999.373 * t - 2.47;
		d = 1 + 0.0334 * Cos(w) + 0.0007 * Cos(2 * w);
		est = 0;
		for (var n = 0; n < 24; n++) {
			est += e1[n] * Cos(e2[n] + (e3[n] * t));
		}
		jd += (0.00001 * est) / d;
		A[++i] = Date.fromJulian(jd);
	}
	return wch && A[wch] ? A[wch] : A;
};

// minimized version of https://github.com/jherdman/javascript-relative-time-helpers
Date.prototype.toRelativeTime=function(){var s=function(t){return t||(t=0),"string"==typeof t&&(t=parseInt(t,10)),"number"==typeof t?(isNaN(t)&&(t=0),{nowThreshold:t}):t;},y=function(t,o,r){var n=t.getUTCDay(),e=n-o.getUTCDay();return (0==e?r.today:-1==e?r.yesterday:1==e&&o<t?r.tomorrow:"on "+r.days[n])+" "+r.at+" "+t.toLocaleTimeString().slice(0,5);},d={millisecond:1,second:1e3,minute:60,hour:60,day:24,month:30,year:12},f=d.millisecond*d.second*d.minute*d.hour*d.day,w={today:"today",yesterday:"yesterday",tomorrow:"tomorrow",at:"at",from_now:"from now",ago:"ago",right_now:"right now",just_now:"just now",days:DAYS,pluralize:function(t,o){return 1<t?o+"s":o;}};return function(t){var o=s(t),r=o.now||new Date,n=o.texts||w,e=r-this,a=e<=0;if((e=Math.abs(e))<=o.nowThreshold)return a?n.right_now:n.just_now;if(o.smartDays&&e<=6*f)return y(this,r,n);var i=null;for(var u in d){if(e<d[u])break;e/=d[i=u];}return[e=Math.floor(e),i=n.pluralize(e,i),a?n.from_now:n.ago].join(" ");};}(),Date.fromString=function(t){return new Date(Date.parse(t));};

Math.degRad = function (d) {
	return (d * Math.PI) / 180.0;
};

Math.degSin = function (d) {
	return Math.sin(Math.degRad(d));
};

Math.degCos = function (d) {
	return Math.cos(Math.degRad(d));
};

function add_to_dates(obj, adate, astring) {
	if ( typeof obj[adate] == "undefined" ) {
		obj[adate] = [astring];
	}
	else {
		obj[adate].unshift(astring);
	}
	return obj;
}

function astronomy(longitude, latitude, place) {
	var now = get_UTCDate();
	var sun = SunCalc.getTimes(now, longitude, latitude);
	var moon = [SunCalc.getMoonIllumination(now), SunCalc.getMoonTimes(now, longitude, latitude)];
	var string = [do_solar(now, sun), do_lunar(now, moon), day_length(sun)];
	document.querySelector("#" + place + " .conditions span:nth-child(8)").innerHTML = "<p>" + string.join(" ").trim() + "</p>";
}

function chinese_new_year(year) {
	var dates = {
		// "2000": ["05 Feb", "dragon"],
		// "2001": ["24 Jan", "snake"],
		// "2002": ["12 Feb", "horse"],
		// "2003": ["01 Feb", "goat"],
		// "2004": ["22 Jan", "monkey"],
		// "2005": ["09 Feb", "rooster"],
		// "2006": ["29 Jan", "dog"],
		// "2007": ["18 Feb", "pig"],
		// "2008": ["07 Feb", "rat"],
		// "2009": ["26 Jan", "ox"],
		// "2010": ["14 Feb", "tiger"],
		// "2011": ["03 Feb", "rabbit"],
		// "2012": ["23 Jan", "dragon"],
		// "2013": ["10 Feb", "snake"],
		// "2014": ["31 Jan", "horse"],
		// "2015": ["19 Feb", "goat"],
		// "2016": ["08 Feb", "monkey"],
		// "2017": ["28 Jan", "rooster"],
		"2018": ["16 Feb", "dog"],
		"2019": ["05 Feb", "pig"],
		"2020": ["25 Jan", "rat"],
		"2021": ["12 Feb", "ox"],
		"2022": ["01 Feb", "tiger"],
		"2023": ["22 Jan", "rabbit"],
		"2024": ["10 Feb", "dragon"],
		"2025": ["29 Jan", "snake"],
		"2026": ["17 Feb", "horse"],
		"2027": ["06 Feb", "goat"],
		"2028": ["26 Jan", "monkey"],
		"2029": ["13 Feb", "rooster"],
		"2030": ["03 Feb", "dog"],
		"2031": ["23 Jan", "pig"],
		"2032": ["11 Feb", "rat"],
		"2033": ["31 Jan", "ox"],
		"2034": ["19 Feb", "tiger"],
		"2035": ["08 Feb", "rabbit"],
		"2036": ["28 Jan", "dragon"],
		"2037": ["15 Feb", "snake"],
		"2038": ["04 Feb", "horse"],
		"2039": ["24 Jan", "goat"],
		"2040": ["12 Feb", "monkey"],
		"2041": ["01 Feb", "rooster"],
		"2042": ["22 Jan", "dog"],
		"2043": ["10 Feb", "pig"],
		"2044": ["30 Jan", "rat"],
		"2045": ["17 Feb", "ox"],
		"2046": ["06 Feb", "tiger"],
		"2047": ["26 Jan", "rabbit"],
		"2048": ["14 Feb", "dragon"],
		"2049": ["02 Feb", "snake"],
		"2050": ["23 Jan", "horse"],
		"2051": ["11 Feb", "goat"],
		"2052": ["01 Feb", "monkey"],
		"2053": ["19 Feb", "rooster"],
		"2054": ["08 Feb", "dog"],
		"2055": ["28 Jan", "pig"],
		"2056": ["15 Feb", "rat"],
		"2057": ["04 Feb", "ox"],
		"2058": ["24 Jan", "tiger"],
		"2059": ["12 Feb", "rabbit"],
		"2060": ["02 Feb", "dragon"],
		"2061": ["21 Jan", "snake"],
		"2062": ["09 Feb", "horse"],
		"2063": ["29 Jan", "goat"],
		"2064": ["17 Feb", "monkey"],
		"2065": ["05 Feb", "rooster"],
		"2066": ["26 Jan", "dog"],
		"2067": ["14 Feb", "pig"],
		"2068": ["03 Feb", "rat"],
		"2069": ["23 Jan", "ox"],
		"2070": ["11 Feb", "tiger"],
		"2071": ["31 Jan", "rabbit"],
		"2072": ["19 Feb", "dragon"],
		"2073": ["07 Feb", "snake"],
		"2074": ["27 Jan", "horse"],
		"2075": ["15 Feb", "goat"],
		"2076": ["05 Feb", "monkey"],
		"2077": ["24 Jan", "rooster"],
		"2078": ["12 Feb", "dog"],
		"2079": ["02 Feb", "pig"],
		"2080": ["22 Jan", "rat"],
		"2081": ["09 Feb", "ox"],
		"2082": ["29 Jan", "tiger"],
		"2083": ["17 Feb", "rabbit"],
		"2084": ["06 Feb", "dragon"],
		"2085": ["26 Jan", "snake"],
		"2086": ["14 Feb", "horse"],
		"2087": ["03 Feb", "goat"],
		"2088": ["24 Jan", "monkey"],
		"2089": ["10 Feb", "rooster"],
		"2090": ["30 Jan", "dog"],
		"2091": ["18 Feb", "pig"],
		"2092": ["07 Feb", "rat"],
		"2093": ["27 Jan", "ox"],
		"2094": ["15 Feb", "tiger"],
		"2095": ["05 Feb", "rabbit"],
		"2096": ["25 Jan", "dragon"],
		"2097": ["12 Feb", "snake"],
		"2098": ["01 Feb", "horse"],
		"2099": ["21 Jan", "goat"]};
	return dates[year] || null;
}

function close_sentence(sentence) {
	if ( sentence.length > 0 ) { sentence = sentence.join(" "); }
	return [sentence + "."];
}

function colder_or_hotter(temp, compare, which, coldest, hottest) {
	if (temp === null) { return ""; }
	if (temp >= hottest[0] && which == "yesterday") {
		return "It is the hottest ever recorded";
	}
	else if (temp <= coldest[0] && which == "yesterday") {
		return "It is the coldest ever recorded";
	}

	var word = "";
	if ( which == "yesterday" && coldest[0] == temp ) { word = "cold"; }
	else if ( which == "yesterday" &&  hottest[0] == temp ) { word = "hott"; }
	else {
		if ( compare[0] == null || temp == null ) { return word; }
		if ( (compare[0] + compare[3]) <= temp && temp >= (compare[0] - compare[3]) ) {
			return word;
		}
		else if ( temp >= (compare[0] + compare[3]) ) {
			word = "warm";
		}
		else if ( temp <= (compare[0] - compare[3]) ) {
			word = "cool";
		}
		else {
			return word;
		}
		return "It is " + word + "er than";
	}
	return "";
}

function compile_dates() {
	var current_year = new Date().getUTCFullYear();
	var dates = {
		"01 Jan": ["<a href=\"https://en.wikipedia.org/wiki/New_Year%27s_Day\">New Year's Day</a> / <a href=\"https://en.wikipedia.org/wiki/Kwanzaa\">End of Kwanzaa</a>", "<a href=\"https://en.wikipedia.org/wiki/The_Twelve_Days_of_Christmas_(song)\">Eight maids a-milking</a>"],
		"02 Jan": ["><a href=\"https://en.wikipedia.org/wiki/The_Twelve_Days_of_Christmas_(song)\">Nine ladies dancing</a>"],
		"03 Jan": ["><a href=\"https://en.wikipedia.org/wiki/The_Twelve_Days_of_Christmas_(song)\">Ten lords a-leaping</a>"],
		"04 Jan": ["><a href=\"https://en.wikipedia.org/wiki/The_Twelve_Days_of_Christmas_(song)\">Eleven pipers piping</a>"],
		"05 Jan": ["<a href=\"https://en.wikipedia.org/wiki/Twelfth_Night_(holiday)\">Twelfth Night</a>", "<a href=\"https://en.wikipedia.org/wiki/The_Twelve_Days_of_Christmas_(song)\">Twelve drummers drumming</a>"],
		"06 Jan": ["<a href=\"https://en.wikipedia.org/wiki/Epiphany_(holiday)\">Epiphany</a>"],
		"07 Jan": ["<a href=\"https://en.wikipedia.org/wiki/Distaff_Day\">Distaff Day</a>"],
		"08 Jan": ["<a href=\"https://en.wikipedia.org/wiki/List_of_Blade_Runner_characters#Roy_Batty\">Roy Batty Inception Day (Blade Runner)</a>", "<a href=\"https://en.wikipedia.org/wiki/Voyageurs_National_Park\">Voyageurs National Park</a> founded"],
		"09 Jan": ["><a href=\"https://en.wikipedia.org/wiki/Wind_Cave_National_Park\">Wind Cave National Park</a> founded"],
		"10 Jan": ["><a href=\"https://en.wikipedia.org/wiki/Pinnacles_National_Park\">Pinnacles National Park</a> founded"],
		"12 Jan": ["><a href=\"https://en.wikipedia.org/wiki/History_of_wolves_in_Yellowstone\">Wolves re-introduced into Yellowstone (1995)</a> <a href=\"https://en.wikipedia.org/wiki/HAL_9000\">Activation of HAL 9000 (2001: A Space Odyssey)</a>"],
		"18 Jan": ["><a href=\"https://en.wikipedia.org/wiki/White_Sands_National_Park\">White Sands National Park founded</a>"],
		"25 Jan": ["<a href=\"https://en.wikipedia.org/wiki/Burns_supper\">Burns Night</a>"],
		"26 Jan": ["><a href=\"https://en.wikipedia.org/wiki/Rocky_Mountain_National_Park\">Rocky Mountain National Park</a> founded"],
		"01 Feb": ["><a href=\"https://en.wikipedia.org/wiki/Imbolc\">Imbolc</a>"],
		"02 Feb": ["<a href=\"https://en.wikipedia.org/wiki/Groundhog_Day\">Groundhog Day</a>"],
		"13 Feb": ["<a href=\"https://en.wikipedia.org/wiki/World_Radio_Day\">World Radio Day</a>"],
		"14 Feb": ["<a href=\"https://en.wikipedia.org/wiki/Valentine%27s_Day\">Valentine's Day</a>", "<a href=\"https://en.wikipedia.org/wiki/List_of_Blade_Runner_characters#Pris_Stratton\">Pris Inception Day (Blade Runner)</a>"],
		"15 Feb": ["><a href=\"https://en.wikipedia.org/wiki/Indiana_Dunes_National_Park\">Indiana Dunes National Park</a> founded"],
		"22 Feb": ["><a href=\"https://en.wikipedia.org/wiki/Gateway_Arch_National_Park\">Gateway Arch National Park</a> founded"],
		"24 Feb": ["><a href=\"https://en.wikipedia.org/wiki/Laura_Palmer\">Anniversary of Laura Palmer's Murder (Twin Peaks)</a>"],
		"25 Feb": ["><a href=\"https://en.wikipedia.org/wiki/Bryce_Canyon_National_Park\">Bryce Canyon National Park</a> founded"],
		"26 Feb": ["><a href=\"https://en.wikipedia.org/wiki/Grand_Teton_National_Park\">Grand Teton</a>, <a href=\"https://en.wikipedia.org/wiki/Denali_National_Park_and_Preserve\">Denali</a>, <a href=\"https://en.wikipedia.org/wiki/Acadia_National_Park\">Acadia</a> and <a href=\"https://en.wikipedia.org/wiki/Grand_Canyon_National_Park\">Grand Canyon</a> National Parks founded"],
		"01 Mar": ["<a href=\"https://en.wikipedia.org/wiki/Saint_David%27s_Day\">St David's Day</a>, <a href=\"https://en.wikipedia.org/wiki/Yellowstone_National_Park\">Yellowstone National Park</a> founded"],
		"02 Mar": ["><a href=\"https://en.wikipedia.org/wiki/Mount_Rainier_National_Park\">Mount Rainier National Park</a> founded"],
		"03 Mar": ["<a href=\"https://en.wikipedia.org/wiki/World_Wildlife_Day\">World Wildlife Day</a>"],
		"04 Mar": ["><a href=\"https://en.wikipedia.org/wiki/Hot_Springs_National_Park\">Hot Springs</a> and <a href=\"https://en.wikipedia.org/wiki/Kings_Canyon_National_Park\">Kings Canyon</a> National Parks founded"],
		"05 Mar": ["><a href=\"https://en.wikipedia.org/wiki/Channel_Islands_National_Park\">Channel Islands National Park</a> founded"],
		"11 Mar": ["<a href=\"https://en.wikipedia.org/wiki/Frankenstein\">Frankenstein's Day</a>"],
		"14 Mar": ["<a href=\"https://en.wikipedia.org/wiki/Pi_Day\">Pi Day</a> / <a href=\"https://en.wikipedia.org/wiki/White_Day\">White Day</a>"],
		"17 Mar": ["<a href=\"https://en.wikipedia.org/wiki/St_Patrick%27s_Day\">St Patrick's Day</a>"],
		"20 Mar": ["><a href=\"https://en.wikipedia.org/wiki/International_Day_of_Happiness\">International Day of Happiness</a>"],
		"24 Mar": ["<a href=\"https://en.wikipedia.org/wiki/The_Breakfast_Club\">Breakfast Club Day</a>"],
		"25 Mar": ["<a href=\"https://en.wikipedia.org/wiki/Tolkien_Reading_Day\">Tolkien Reading Day</a>"],
		"03 Apr": ["><a href=\"https://en.wikipedia.org/wiki/Isle_Royale_National_Park\">Isle Royale National Park</a> founded"],
		"12 Apr": ["<a href=\"https://en.wikipedia.org/wiki/Yuri%27s_Night\">Yuri's Night</a>"],
		"21 Apr": ["<a href=\"https://en.wikipedia.org/wiki/National_Tea_Day\">Tea Day</a>"],
		"22 Apr": ["<a href=\"https://en.wikipedia.org/wiki/Earth_Day\">Earth Day</a>"],
		"23 Apr": ["<a href=\"https://en.wikipedia.org/wiki/Saint_George%27s_Day\">St George's Day</a>"],
		"25 Apr": ["<a href=\"https://en.wikipedia.org/wiki/Anzac_Day\">ANZAC Day</a> / <a href=\"https://en.wikipedia.org/wiki/DNA_Day\">DNA Day</a>"],
		"30 Apr": ["<a href=\"https://en.wikipedia.org/wiki/Honesty_Day\">Honesty Day</a>"],
		"04 May": ["<a href=\"https://en.wikipedia.org/wiki/Star_Wars_Day\">Star Wars Day</a>"],
		"08 May": ["<a href=\"https://en.wikipedia.org/wiki/Victory_in_Europe_Day\">VE Day</a>"],
		"11 May": ["><a href=\"https://en.wikipedia.org/wiki/Glacier_National_Park_(U.S.)\">Glacier National Park</a> founded"],
		"14 May": ["><a href=\"https://en.wikipedia.org/wiki/Carlsbad_Caverns_National_Park\">Carlsbad Caverns National Park</a> founded"],
		"20 May": ["<a href=\"https://en.wikipedia.org/wiki/World_Bee_Day\">World Bee Day</a>"],
		"22 May": ["><a href=\"https://en.wikipedia.org/wiki/Crater_Lake_National_Park\">Crater Lake National Park</a> founded", "<a href=\"https://en.wikipedia.org/wiki/Sherlock_Holmes\">Sherlock Holmes Day</a>"],
		"25 May": ["<a href=\"https://en.wikipedia.org/wiki/Towel_Day\">Towel Day</a>"],
		"30 May": ["><a href=\"https://en.wikipedia.org/wiki/Everglades_National_Park\">Everglades National Park</a> founded"],
		"03 Jun": ["<a href=\"https://en.wikipedia.org/wiki/World_Bicycle_Day\">World Bicycle Day</a>"],
		"05 Jun": ["<a href=\"https://en.wikipedia.org/wiki/Ferris_Bueller%27s_Day_Off\">Ferris Bueller's Day Off</a>"],
		"06 Jun": ["<a href=\"https://en.wikipedia.org/wiki/Normandy_landings\">D-Day</a>"],
		"12 Jun": ["><a href=\"https://en.wikipedia.org/wiki/Big_Bend_National_Park\">Big Bend National Park</a> founded"],
		"14 Jun": ["<a href=\"https://en.wikipedia.org/wiki/Flag_Day_(United_States)\">Flag Day (USA)</a>"],
		"15 Jun": ["><a href=\"https://en.wikipedia.org/wiki/Great_Smoky_Mountains_National_Park\">Great Smoky Mountains National Park</a> founded"],
		"28 Jun": ["<a href=\"https://en.wikipedia.org/wiki/Pi_Day\">Tau Day</a>, <a href=\"https://en.wikipedia.org/wiki/Biscayne_National_Park\">Biscayne National Park</a> founded"],
		"29 Jun": ["><a href=\"https://en.wikipedia.org/wiki/Mesa_Verde_National_Park\">Mesa Verde</a> and <a href=\"https://en.wikipedia.org/wiki/Olympic_National_Park\">Olympic</a> National Parks founded"],
		"30 Jun": ["<a href=\"https://en.wikipedia.org/wiki/Asteroid_Day\">International Asteroid Day</a>"],
		"01 Jul": ["><a href=\"https://en.wikipedia.org/wiki/Mammoth_Cave_National_Park\">Mammoth Cave National Park</a> founded"],
		"04 Jul": ["<a href=\"https://en.wikipedia.org/wiki/Independence_Day_(United_States)\">Independence Day (USA)</a>"],
		"12 Jul": ["><a href=\"https://en.wikipedia.org/wiki/Battle_of_the_Boyne\">Battle of the Boyne</a> / <a href=\"https://en.wikipedia.org/wiki/The_Twelfth\">The Twelfth</a>"],
		"22 Jul": ["<a href=\"https://en.wikipedia.org/wiki/Pi_Day\">Pi Approximation Day</a>"],
		"01 Aug": ["<a href=\"https://en.wikipedia.org/wiki/Lughnasadh\">Lughnasadh</a>, <a href=\"https://en.wikipedia.org/wiki/Haleakal%C4%81_National_Park\">Haleakala</a> and <a href=\"https://en.wikipedia.org/wiki/Hawai%CA%BBi_Volcanoes_National_Park\">Hawaii Volcanoes</a> National Parks founded"],
		"02 Aug": ["><a href=\"https://en.wikipedia.org/wiki/Virgin_Islands_National_Park\">Virgin Islands National Park</a> founded"],
		"09 Aug": ["><a href=\"https://en.wikipedia.org/wiki/Lassen_Volcanic_National_Park\">Lassen Volcanic National Park</a> founded"],
		"12 Aug": ["><a href=\"https://en.wikipedia.org/wiki/Glorious_Twelfth\">Glorious Twelfth</a>"],
		"15 Aug": ["><a href=\"https://en.wikipedia.org/wiki/Assumption_of_Mary\">Assumption of Mary</a>"],
		"25 Aug": ["><a href=\"https://en.wikipedia.org/wiki/Christmas_in_August_(Yellowstone)\">Christmas Day in Yellowstone</a>"],
		"12 Sep": ["><a href=\"https://en.wikipedia.org/wiki/Canyonlands_National_Park\">Canyonlands National Park</a> founded"],
		"13 Sep": ["><a href=\"https://en.wikipedia.org/wiki/Great_Sand_Dunes_National_Park_and_Preserve\">Great Sand Dunes National Park</a> founded"],
		"25 Sep": ["><a href=\"https://en.wikipedia.org/wiki/Sequoia_National_Park\">Sequoia National Park</a> founded"],
		"01 Oct": ["><a href=\"https://en.wikipedia.org/wiki/Yosemite_National_Park\">Yosemite National Park</a> founded"],
		"02 Oct": ["><a href=\"https://en.wikipedia.org/wiki/North_Cascades_National_Park\">North Cascades</a> and <a href=\"https://en.wikipedia.org/wiki/Redwood_National_and_State_Parks\">Redwood</a> National Parks founded"],
		"04 Oct": ["><a href=\"https://www.timeanddate.com/holidays/us/st-francis-assisi-feast\">Feast of St Francis of Assisi</a>"],
		"11 Oct": ["><a href=\"https://en.wikipedia.org/wiki/Cuyahoga_Valley_National_Park\">Cuyahoga Valley National Park</a> founded"],
		"14 Oct": ["><a href=\"https://en.wikipedia.org/wiki/Saguaro_National_Park\">Saguaro National Park</a> founded"],
		"15 Oct": ["><a href=\"https://en.wikipedia.org/wiki/Guadalupe_Mountains_National_Park\">Guadalupe Mountains National Park</a> founded"],
		"21 Oct": ["><a href=\"https://en.wikipedia.org/wiki/Black_Canyon_of_the_Gunnison_National_Park\">Black Canyon of the Gunnison National Park</a> founded", "<a href=\"https://en.wikipedia.org/wiki/Back_to_the_Future_(franchise)#Back_to_the_Future_Day\">Back To The Future Day</a>"],
		"23 Oct": ["<a href=\"https://en.wikipedia.org/wiki/Mole_Day\">Mole Day</a>"],"26 Oct": ["><a href=\"https://en.wikipedia.org/wiki/Dry_Tortugas_National_Park\">Dry Tortugas National Park</a> founded"],
		"27 Oct": ["><a href=\"https://en.wikipedia.org/wiki/Great_Basin_National_Park\">Great Basin National Park</a> founded"],
		"31 Oct": ["<a href=\"https://en.wikipedia.org/wiki/Halloween\">Hallowe'en</a>", "<a href=\"https://en.wikipedia.org/wiki/Samhain\">Samhain</a>, <a href=\"https://en.wikipedia.org/wiki/Death_Valley_National_Park\">Death Valley</a>, <a href=\"https://en.wikipedia.org/wiki/Joshua_Tree_National_Park\">Joshua Tree</a> and <a href=\"https://en.wikipedia.org/wiki/National_Park_of_American_Samoa\">American Samoa</a> National Parks founded"],
		"01 Nov": ["<a href=\"https://en.wikipedia.org/wiki/All_Saints%27_Day\">All Saints' Day</a>"],
		"02 Nov": ["<a href=\"https://en.wikipedia.org/wiki/All_Souls%27_Day\">All Souls' Day</a>"],
		"05 Nov": ["<a href=\"https://en.wikipedia.org/wiki/Guy_Fawkes_Night\">Guy Fawkes Night</a>"],
		"10 Nov": ["><a href=\"https://en.wikipedia.org/wiki/Congaree_National_Park\">Congaree</a>, <a href=\"https://en.wikipedia.org/wiki/Badlands_National_Park\">Badlands</a> and <a href=\"https://en.wikipedia.org/wiki/Theodore_Roosevelt_National_Park\">Theodore Roosevelt</a> National Parks founded"],
		"11 Nov": ["<a href=\"https://en.wikipedia.org/wiki/Remembrance_Sunday\">Remembrance Day</a>"],
		"12 Nov": ["><a href=\"https://en.wikipedia.org/wiki/Arches_National_Park\">Arches National Park</a> founded", "<a href=\"https://en.wikipedia.org/wiki/Back_to_the_Future\">Anniversary of the Hill Valley Lightning Strike (Back to the Future)</a>"],
		"19 Nov": ["><a href=\"https://en.wikipedia.org/wiki/Zion_National_Park\">Zion National Park</a> founded"],
		"21 Nov": ["<a href=\"https://en.wikipedia.org/wiki/World_Television_Day\">World Television Day</a>"],
		"30 Nov": ["<a href=\"St Andrew's Day\">St Andrew's Day</a>"],
		"09 Dec": ["><a href=\"https://en.wikipedia.org/wiki/Petrified_Forest_National_Park\">Petrified Forest National Park</a> founded"],
		"02 Dec": ["><a href=\"https://en.wikipedia.org/wiki/Gates_of_the_Arctic_National_Park_and_Preserve\">Gates of the Arctic</a>, <a href=\"https://en.wikipedia.org/wiki/Glacier_Bay_National_Park_and_Preserve\">Glacier Bay</a>, <a href=\"https://en.wikipedia.org/wiki/Katmai_National_Park_and_Preserve\">Katmai</a>, <a href=\"https://en.wikipedia.org/wiki/Kenai_Fjords_National_Park\">Kenai Fjords</a>, <a href=\"https://en.wikipedia.org/wiki/Kobuk_Valley_National_Park\">Kobuk Valley</a>, <a href=\"https://en.wikipedia.org/wiki/Lake_Clark_National_Park_and_Preserve\">Lake Clark</a> and <a href=\"https://en.wikipedia.org/wiki/Wrangell%E2%80%93St._Elias_National_Park_and_Preserve\">Wrangell - St Elias</a> National Parks founded"],
		"08 Dec": ["><a href=\"https://en.wikipedia.org/wiki/Feast_of_the_Immaculate_Conception\">Feast of the Immaculate Conception</a>"],
		"18 Dec": ["><a href=\"https://en.wikipedia.org/wiki/Capitol_Reef_National_Park\">Capitol Reef National Park</a> founded"],
		"24 Dec": ["<a href=\"https://en.wikipedia.org/wiki/Christmas_Eve\">Christmas Eve</a>"],
		"25 Dec": ["<a href=\"https://en.wikipedia.org/wiki/Christmas_day\">Christmas Day</a>", "<a href=\"https://en.wikipedia.org/wiki/The_Twelve_Days_of_Christmas_(song)\">A partridge in a pear tree</a>"],
		"26 Dec": ["<a href=\"https://en.wikipedia.org/wiki/Boxing_Day\">Boxing Day</a> / <a href=\"https://en.wikipedia.org/wiki/Kwanzaa\">Beginning of Kwanzaa</a>", "<a href=\"https://en.wikipedia.org/wiki/The_Twelve_Days_of_Christmas_(song)\">Two turtle doves</a>, <a href=\"https://en.wikipedia.org/wiki/Shenandoah_National_Park\">Shenandoah National Park</a> founded"],
		"27 Dec": ["><a href=\"https://en.wikipedia.org/wiki/The_Twelve_Days_of_Christmas_(song)\">Three french hens</a>"],
		"28 Dec": ["><a href=\"https://en.wikipedia.org/wiki/The_Twelve_Days_of_Christmas_(song)\">Four calling birds</a>"],
		"29 Dec": ["><a href=\"https://en.wikipedia.org/wiki/The_Twelve_Days_of_Christmas_(song)\">Five gold rings</a>"],
		"30 Dec": ["><a href=\"https://en.wikipedia.org/wiki/The_Twelve_Days_of_Christmas_(song)\">Six geese a-laying</a>"],
		"31 Dec": ["<a href=\"https://en.wikipedia.org/wiki/New_Year%27s_Eve\">New Year's Eve</a>", "<a href=\"https://en.wikipedia.org/wiki/The_Twelve_Days_of_Christmas_(song)\">Seven swans a-swimming</a>"]
	};
	dates = doEaster(dates, current_year);
	dates = doChineseNewYear(dates, current_year);
	dates = doSpecialDays(dates, current_year);
	dates = dates[get_Date(new Date(LOCALTIME.format(new Date)).toUTCString(), false)];
	if ( typeof dates != "undefined" ) {
		var start = "It is ";
		if (dates[0].startsWith('>')) {
			start = "";
		}
		for ( var d=0; d<dates.length; d++ ) {
			if (dates[d].startsWith('>')) {
				dates[d] = dates[d].substring(1);
			}
		}
		dates = "<p>" + start + dates.join(".  ").trim() + ".</p>";
		document.querySelector("#header").style.display = "block";
		document.querySelector("#header span:nth-child(1)").innerHTML = dates;
	}
	else {
		dates = "";
		document.querySelector("#header").style.display = "none";
	}
}

function convertUV(num) {
	var colour = SCALE_UV(parseInt(num)).hex();
	if ( num == "" || num <= 2) { return ["L", "low", colour, "You can safely stay outside."]; }
	else if ( num <= 5) { return ["M", "moderate", colour, "Take care during midday hours and do not spend too much time in the sun unprotected."]; }
	else if ( num <= 7) { return ["H", "high", colour, "Seek shade during midday hours, cover up and wear sunscreen."]; }
	else if ( num <= 10) { return ["V", "very high", colour, "Spend time in the shade between 11am and 3pm. A shirt, sunscreen and hat are essential."]; }
	return ["E", "extreme", colour, "Avoid being outside during midday hours. A shirt, sunscreen and hat are essential."];
}

function convert_Dobson_to_text(value) {
	// convert Dobson units to text
	// see: http://sacs.aeronomie.be/info/dobson.php
	value = parseInt(0.21415 * value);
	var colour = SCALE_OZONE(value).hex();
	if (value <= 100 ) { return ["L", "low", colour]; }
	else if ( value <= 160 ) { return ["M", "moderate", colour]; }
	else if ( value <= 240 ) { return ["H", "high", colour]; }
	else {  return ["E", "very high", colour]; }
}

function convert_visibility(value) {
	if ( value < 0.03 ) { return "there is a dense fog"; }
	else if ( value < 0.12 ) { return "there is thick fog"; }
	else if ( value < 0.31 ) { return "there is a moderate fog"; }
	else if ( value < 0.62 ) { return "there is a light fog"; }
	else if ( value < 1.24 ) { return "there is thin fog"; }
	else if ( value < 2.48 ) { return "the air is hazy"; }
	else if ( value < 6.21 ) { return "there is a light haze"; }
	else if ( value < 12.42 ) { return "the air is clear"; }
	else if ( value < 31.07 ) { return "the air is very clear"; }
	else if ( value < 172.12 ) { return "the air is exceptionally clear"; }
	return "there is pure air";
}

function csv_to_array( strData ){
	var data = strData.split("\n");
	var arrData = [];
	for ( var i=0; i<data.length; i++ ) {
		if ( data[i].length == 0 ) { continue; }
		arrData.push(data[i].split(","));
	}
	return( arrData );
}

function day_length(sun) {
	try {
		var date = new Date(null);
		date.setSeconds((sun.sunset - sun.sunrise)/1000);
		date = date.toISOString().substr(11, 8).split(":");
		for (var d=0;d<3;d++) {
			date[d] = parseInt(date[d]);
			if ( isNaN(date[d]) ) { throw ""; }
		}
		var is = "will be";
		if (new Date().getTime() >= sun.sunset) { is = "was"; }
		return "The day " + is + " " + date[0] + "h " + date[1] + "m " + date[2] + "s long.";
	}
	catch(err) {
		return "";
	}
}

function doBackgroundColour() {
	var gradient_size = Object.keys(BACKGROUND_COLOURS).length;
    var content_width = document.getElementById("content").offsetWidth;
	if (gradient_size > 0 && (content_width > 400 || LOCATIONS.length == 1)) {
		var gradient = ["to right", BACKGROUND_COLOURS[LOCATIONS[0]] + " 0%"];
		for (var c=0;c<gradient_size;c++) {
			gradient.push(BACKGROUND_COLOURS[LOCATIONS[c]] + " " + (100/gradient_size) + "%");
		}
		document.body.style.backgroundImage = "linear-gradient(" + gradient.join(", ") + ")";
	}
	else if ( gradient_size > 0 ) {
		document.body.style.background = BACKGROUND_COLOURS[LOCATIONS[0]];
	}
	else {
		document.body.style.background = "#ffffff";
	}
}

function doChineseNewYear(obj, YYYY){
	var fetch = chinese_new_year(YYYY);
	if ( fetch != null ) {
		add_to_dates(obj, fetch[0], "><a href=\"https://en.wikipedia.org/wiki/Chinese_New_Year\">Chinese New Year</a> (Year of the " + toTitleCase(fetch[1]) + ")");
	}
	return obj;
}

function doEaster(obj, YYYY) {
	var easter = when_is_easter(YYYY);
	obj = add_to_dates(obj, get_Date(new Date((easter - (0 * 86400)) * 1000).toUTCString(), false, 2), "<a href=\"https://en.wikipedia.org/wiki/Easter_Saturday\">Easter Sunday</a>");
	obj = add_to_dates(obj, get_Date(new Date((easter - (1 * 86400)) * 1000).toUTCString(), false, 2), "<a href=\"https://en.wikipedia.org/wiki/Holy_Saturday\">Holy Saturday</a>");
	obj = add_to_dates(obj, get_Date(new Date((easter - (2 * 86400)) * 1000).toUTCString(), false, 2), "<a href=\"https://en.wikipedia.org/wiki/Good_Friday\">Good Friday</a>");
	obj = add_to_dates(obj, get_Date(new Date((easter - (3 * 86400)) * 1000).toUTCString(), false, 2), "<a href=\"https://en.wikipedia.org/wiki/Good_Friday\">Maundy Thursday</a>");
	obj = add_to_dates(obj, get_Date(new Date((easter - (7 * 86400)) * 1000).toUTCString(), false, 2), "<a href=\"https://en.wikipedia.org/wiki/Palm_sunday\">Palm Sunday</a>");
	obj = add_to_dates(obj, get_Date(new Date((easter - (21 * 86400)) * 1000).toUTCString(), false, 2), "<a href=\"https://en.wikipedia.org/wiki/Mothering_Sunday\">Mothering Sunday</a>");
	obj = add_to_dates(obj, get_Date(new Date((easter - (47 * 86400)) * 1000).toUTCString(), false, 2), "<a href=\"https://en.wikipedia.org/wiki/Shrove_Tuesday\">Shrove Tuesday / Pancake Day</a>");
	obj = add_to_dates(obj, get_Date(new Date((easter - (46 * 86400)) * 1000).toUTCString(), false, 2), "<a href=\"https://en.wikipedia.org/wiki/Ash_Wednesday\">Ash Wednesday</a>");
	obj = add_to_dates(obj, get_Date(new Date((easter + (1 * 86400)) * 1000).toUTCString(), false, 2), "<a href=\"https://en.wikipedia.org/wiki/Easter_Monday\">Easter Monday</a>");
	obj = add_to_dates(obj, get_Date(new Date((easter + (39 * 86400)) * 1000).toUTCString(), false, 2), "><a href=\"https://en.wikipedia.org/wiki/Feast_of_the_Ascension\">Feast of the Ascension</a>");
	obj = add_to_dates(obj, get_Date(new Date((easter + (49 * 86400)) * 1000).toUTCString(), false, 2), "<a href=\"https://en.wikipedia.org/wiki/Pentecost\">Pentecost</a> / <a href=\"https://en.wikipedia.org/wiki/Whitsun\">Whitsunday</a>");
	obj = add_to_dates(obj, get_Date(new Date((easter + (56 * 86400)) * 1000).toUTCString(), false, 2), "<a href=\"https://en.wikipedia.org/wiki/Trinity_Sunday\">Trinity Sunday</a>");
	obj = add_to_dates(obj, get_Date(new Date((easter + (60 * 86400)) * 1000).toUTCString(), false, 2), "><a href=\"https://en.wikipedia.org/wiki/Corpus_Christi_(feast)\">Corpus Christi</a>");
	return obj;
}

function doSpecialDays(obj, YYYY) {
	// first monday in the year after twelfth night
	var proposed = get_Date(new Date(getMonthlyWeekday(1, "Monday", new Date(YYYY, 0)) * 1000).toUTCString(), false, 2);
	proposed = proposed.split(" ");
	if ( parseInt(proposed) < 6 ) { proposed[0] = parseInt(proposed[0]) + 7; }
	add_to_dates(obj, zeroPad(proposed[0], 2) + " " + proposed[1], "<a href=\"https://en.wikipedia.org/wiki/Plough_Monday\">Plough Monday</a>");

	// 5 july unless 5 july is saturday or sunday
	var use_monday = false;
	proposed = get_Date(new Date(getMonthlyWeekday(1, "Saturday", new Date(YYYY, 6)) * 1000).toUTCString(), false, 2);
	if ( proposed == "05 Jul" ) {
		use_monday = true;
		proposed = get_Date(new Date(getMonthlyWeekday(2, "Monday", new Date(YYYY, 6)) * 1000).toUTCString(), false, 2);
	}
	if ( ! use_monday ) {
		proposed = get_Date(new Date(getMonthlyWeekday(1, "Sunday", new Date(YYYY, 6)) * 1000).toUTCString(), false, 2);
		if ( proposed == "05 Jul" ) {
			use_monday = true;
			proposed = get_Date(new Date(getMonthlyWeekday(1, "Monday", new Date(YYYY, 6)) * 1000).toUTCString(), false, 2);
		}
	}
	if ( ! use_monday ) {
		proposed = "05 Jul";
	}
	add_to_dates(obj, proposed, "<a href=\"https://en.wikipedia.org/wiki/Tynwald_Day\">Tynwald Day</a>");

	add_to_dates(obj, get_Date(new Date(getMonthlyWeekday(-2, "Sunday", new Date(YYYY, 12, 25)) * 1000).toUTCString(), false, 2), "><a href=\"https://en.wikipedia.org/wiki/Gaudete_Sunday\">Gaudete Sunday</a>");

	add_to_dates(obj, get_Date(new Date(getMonthlyWeekday(1, "Monday", new Date(YYYY, 0)) * 1000).toUTCString(), false, 2), "><a href=\"https://en.wikipedia.org/wiki/Handsel_Monday\">Handsel Monday</a>");
	add_to_dates(obj, get_Date(new Date(getMonthlyWeekday(1, "Saturday", new Date(YYYY, 1)) * 1000).toUTCString(), false, 2), "><a href=\"https://en.wikipedia.org/wiki/Ice_Cream_for_Breakfast_Day\">Ice cream for breakfast Day</a>");
	add_to_dates(obj, get_Date(new Date(getMonthlyWeekday(3, "Monday", new Date(YYYY, 1)) * 1000).toUTCString(), false, 2), "<a href=\"https://en.wikipedia.org/wiki/Presidents_Day\">Presidents' Day (USA)</a>");
	add_to_dates(obj, get_Date(new Date(getMonthlyWeekday(3, "Monday", new Date(YYYY, 0)) * 1000).toUTCString(), false, 2), "<a href=\"https://en.wikipedia.org/wiki/Martin_Luther_King_Jr._Day\">Martin Luther King Jr Day (USA)</a>");
	add_to_dates(obj, get_Date(new Date(getMonthlyWeekday(1, "Monday", new Date(YYYY, 4)) * 1000).toUTCString(), false, 2), "><a href=\"https://en.wikipedia.org/wiki/May_Day\">May Day bank holiday Monday</a>");
	add_to_dates(obj, get_Date(new Date(getMonthlyWeekday(2, "Saturday", new Date(YYYY, 4)) * 1000).toUTCString(), false, 2), "><a href=\"https://en.wikipedia.org/wiki/Bird_Day#World_Migratory_Bird_Day\">World Migratory Bird Day</a>");
	add_to_dates(obj, get_Date(new Date(getMonthlyWeekday(2, "Saturday", new Date(YYYY, 5)) * 1000).toUTCString(), false, 2), "><a href=\"https://en.wikipedia.org/wiki/Trooping_the_Colour\">Trooping the Colour</a>");
	add_to_dates(obj, get_Date(new Date(getMonthlyWeekday(3, "Sunday", new Date(YYYY, 5)) * 1000).toUTCString(), false, 2), "<a href=\"https://en.wikipedia.org/wiki/Father%27s_Day\">Father's Day</a>");
	add_to_dates(obj, get_Date(new Date(getMonthlyWeekday(1, "Monday", new Date(YYYY, 8)) * 1000).toUTCString(), false, 2), "<a href=\"https://en.wikipedia.org/wiki/Labor_Day\">Labor Day (USA)</a>");
	add_to_dates(obj, get_Date(new Date(getMonthlyWeekday(2, "Monday", new Date(YYYY, 9)) * 1000).toUTCString(), false, 2), "<a href=\"https://en.wikipedia.org/wiki/Columbus_Day\">Columbus Day (USA)</a>");
	add_to_dates(obj, get_Date(new Date(getMonthlyWeekday(4, "Thursday", new Date(YYYY, 10)) * 1000).toUTCString(), false, 2), "<a href=\"https://en.wikipedia.org/wiki/Thanksgiving_(United_States)\">Thanksgiving (USA)</a>");
	add_to_dates(obj, get_Date(new Date(((getMonthlyWeekday(4, "Thursday", new Date(YYYY, 10)) + 86400)) * 1000).toUTCString(), false, 2), "<a href=\"https://en.wikipedia.org/wiki/Black_Friday_(shopping)\">Black Friday</a>");
	add_to_dates(obj, get_Date(new Date(((getMonthlyWeekday(4, "Thursday", new Date(YYYY, 10)) + (4 * 86400))) * 1000).toUTCString(), false, 2), "<a href=\"https://en.wikipedia.org/wiki/Cyber_Monday\">Cyber Monday</a>");

	add_to_dates(obj, get_Date(new Date(getLastXdays("Monday", "May", YYYY) * 1000).toUTCString(), false, 2), "><a href=\"https://en.wikipedia.org/wiki/Bank_holiday#List_of_current_holidays_in_the_United_Kingdom,_Ireland_and_the_Isle_of_Man\">Spring bank holiday Monday</a> / <a href=\"https://en.wikipedia.org/wiki/Memorial_Day\">Memorial Day (USA)</a>");

	add_to_dates(obj, get_Date(new Date(getLastXdays("Monday", "August", YYYY) * 1000).toUTCString(), false, 2), "><a href=\"https://en.wikipedia.org/wiki/Public_holidays_in_the_United_Kingdom\">Summer bank holiday Monday</a>");

	var date = new Date(YYYY + "/12/25").getTime();
	while ( new Date(date).getUTCDay() != 0 ) {
		date -= 86400000;
	}
	add_to_dates(obj, get_Date(new Date(date - (28 * 86400000)).toUTCString(), false, 2), "<a href=\"https://en.wikipedia.org/wiki/Stir-up_Sunday\">Stir-up Sunday</a>");
	add_to_dates(obj, get_Date(new Date(date - (21 * 86400000)).toUTCString(), false, 2), "<a href=\"https://en.wikipedia.org/wiki/Advent_Sunday\">Advent Sunday</a>");

	date = getLastXdays("Sunday", "March", YYYY);
	add_to_dates(obj, get_Date(new Date((date - (1 * 86400)) * 1000).toUTCString(), false, 2), "><a href=\"https://en.wikipedia.org/wiki/Daylight_saving_time\">The clocks go forward one hour tonight.  Spring forward</a>");
	add_to_dates(obj, get_Date(new Date((date - (0 * 86400)) * 1000).toUTCString(), false, 2), "><a href=\"https://en.wikipedia.org/wiki/Daylight_saving_time\">The clocks went forward one hour last night.  Spring forward</a>");

	date = getLastXdays("Sunday", "October", YYYY);
	add_to_dates(obj, get_Date(new Date((date - (1 * 86400)) * 1000).toUTCString(), false, 2), "><a href=\"https://en.wikipedia.org/wiki/Daylight_saving_time\">The clocks go back one hour tonight.  Fall back</a>");
	add_to_dates(obj, get_Date(new Date((date - (0 * 86400)) * 1000).toUTCString(), false, 2), "><a href=\"https://en.wikipedia.org/wiki/Daylight_saving_time\">The clocks went back one hour last night.  Fall back</a>");

	date = Date.getSeasons();
	add_to_dates(obj, get_Date(date[1].toUTCString(), false, 2), "><a href=\"https://en.wikipedia.org/wiki/Equinox\">Vernal equinox</a>.  It is now <a href=\"https://en.wikipedia.org/wiki/Spring_(season)\">spring</a>");
	add_to_dates(obj, get_Date(date[2].toUTCString(), false, 2), "><a href=\"https://en.wikipedia.org/wiki/Summer_solstice\">Summer solstice</a>.  Today is the longest day of the year.  It is now <a href=\"https://en.wikipedia.org/wiki/Summer\">summer</a>");
	add_to_dates(obj, get_Date(date[3].toUTCString(), false, 2), "><a href=\"https://en.wikipedia.org/wiki/Equinox\">Autumnal equinox</a>.  It is now <a href=\"https://en.wikipedia.org/wiki/Autumn\">autumn</a>");
	add_to_dates(obj, get_Date(date[4].toUTCString(), false, 2), "><a href=\"https://en.wikipedia.org/wiki/Winter_solstice\">Winter solstice / Midwinter</a>.  Today is the shortest day of the year.  It is now <a href=\"https://en.wikipedia.org/wiki/Winter\">winter</a>");
	return obj;
}

function do_last_precipitate(place, latest, records) {
	var snowrain = [["snow", 9], ["rain", 8]];
	var precipitate = [];
	for (var sn in snowrain) {
		if ( records[snowrain[sn][1]] != latest[0] && ! isNaN(records[snowrain[sn][1]]) ) {
			precipitate.push( snowrain[sn][0] + "ed " + new Date(records[snowrain[sn][1]] * 1000).toRelativeTime({"smartDays": true}) );
		}
	}
	if ( precipitate.length > 0 ) {
		document.querySelector("#" + place + " .conditions span:nth-child(5)").innerHTML = "<p>It last " + precipitate.join(" and ") + ".</p>";
	}
}

function do_lunar(now, lunar) {
	var string = [];
	if ( typeof lunar[1].alwaysUp != "undefined" ) {
		string.push("The");
		string.push(get_phase(lunar));
		string.push("will not set below the horizon today.");
	}
	else if ( typeof lunar[1].alwaysDown != "undefined" ) {
		string.push("The");
		string.push(get_phase(lunar));
		string.push("will not rise above the horizon today.");
	}
	else {
		string.push( "There is a" );
		string.push(get_phase(lunar));
		// string = close_sentence(string);
		var order = ["rise", "set"];
		if ( lunar[1].set < lunar[1].rise ) {
			order = ["set", "rise"];
		}
		for ( var o in order ){
			if ( now < lunar[1][order[o]] ) {
				string.push( "and it will" );
				string.push( order[o] );
				string.push( "at " + get_time(lunar[1][order[o]]) );
				break;
			}
		}
		string = close_sentence(string);
	}
	return string.join(" ").trim();
}

function do_solar(now, solar) {
	var string = [];
	// check if this is less than the darkest point of the night
	if ( now < solar.nadir ) {
		string.push( "The darkest point of the night is at " + get_time(solar.nadir) + " (" + solar.nadir.toRelativeTime() + ")." );
	}
	// check if it is less than sunrise
	else if ( now < solar.sunrise ) {
		if ( now < solar.dawn ) {
			string.push( "Dawn" );
			if ( solar.dawn <= now ) { string.push( "was" ); } else { string.push( "is" ); }
			string.push( "at " + get_time(solar.dawn) );
			string = close_sentence(string);
		}
		string = is_at( "The sun will rise at", solar.sunrise, string, now );
	}
	// check if it is in the golden hour
	else if ( now < solar.goldenHourEnd ) {
		string.push( "The sun rose at " + get_time(solar.sunrise) + " and the golden hour will end " + solar.goldenHourEnd.toRelativeTime() + " at " + get_time(solar.goldenHourEnd));
		string = close_sentence(string);
	}
	// check if it is less than noon
	else if ( now < solar.solarNoon ) {
		string.push( "The sun will be highest in the sky at " + get_time(solar.solarNoon) + "." );
	}
	// check if it is less than dusk
	else if ( now < solar.dusk ) {
		if ( now < solar.goldenHour ) {
			string.push( "The golden hour starts at " + get_time(solar.goldenHour) );
			string.push( " (" + solar.goldenHour.toRelativeTime() + ")" );
		}
		if ( string.length > 1 ) { string = close_sentence(string); }
		if ( now < solar.sunset ) {
			string = is_at("The sun will set at", solar.sunset, string, now);
		}
		if ( now < solar.dusk ) {
			string.push( "Dusk is at " + get_time(solar.dusk) + "." );
		}
	}
	return string.join(" ").trim();
}

function endsWith(str, suffix) {
	return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function fetchCSV(text) {
	var result = csv_to_array(text);
	var result_num = result.length;
	var records = result[result_num - 1];
	var start_time = parseFloat(records[0]);
	var age = parseFloat(records[1]);
	for ( var i=0; i<result_num; i++ ) {
		if ( i == result_num - 1 ) {
			result[i][0] = parseFloat(result[i][0]);
		}
		else {
			result[i][0] = (age * result[i][0]) + start_time;
		}
		for ( var j in result[i] ){
			if ( ( i == result_num - 1 ) || ( j != 0 && j != 4 && j != 10 && result[i][j] != "" ) ) {
				result[i][j] = parseFloat(result[i][j]);
			}
		}
	}
	result[result_num - 1][5] = (age * result[result_num - 1][5]) + start_time;
	result[result_num - 1][7] = (age * result[result_num - 1][7]) + start_time;
	result[result_num - 1][8] = (age * result[result_num - 1][8]) + start_time;
	result[result_num - 1][9] = (age * result[result_num - 1][9]) + start_time;
	return [result.slice(0,result_num - 1), records];
}

function find_correction(data, hours) {
	// get the time hours ago and find all the temperatures after that
	// return the mean of the differences between the recorded temperature
	// and the temperature given by dark sky
	var nowtime = (get_UTCDate().getTime() / 1000);
	var hoursago = nowtime - ( hours * 3600 );
	var recorded_temps = get_element(data, 1, hoursago, nowtime);
	var ds_temps = get_element(data, 6, hoursago, nowtime);
	return ss.mean(recorded_temps.map(function(item, idx) { return item - ds_temps[idx]; }));
}

function getBeaufortScale(mph) {
	mph = Math.round(mph);
	if ( mph < 4 ) { return "a light wind (" + mph + " mph)"; }
	else if ( mph >= 4 && mph < 8 ) { return "light breeze (" + mph + " mph)"; }
	else if ( mph >= 8 && mph < 13 ) { return "gentle breeze (" + mph + " mph)"; }
	else if ( mph >= 13 && mph < 19 ) { return "breeze (" + mph + " mph)"; }
	else if ( mph >= 19 && mph < 25 ) { return "fresh breeze (" + mph + " mph)"; }
	else if ( mph >= 25 && mph < 32 ) { return "strong breeze (" + mph + " mph)"; }
	else if ( mph >= 32 && mph < 39 ) { return "moderate gale force wind (" + mph + " mph)"; }
	else if ( mph >= 39 && mph < 47 ) { return "fresh gale force wind (" + mph + " mph)"; }
	else if ( mph >= 47 && mph < 55 ) { return "strong gale force wind (" + mph + " mph)"; }
	else if ( mph >= 55 && mph < 64 ) { return "storm force wind (" + mph + " mph)"; }
	else if ( mph >= 64 && mph < 74 ) { return "violent storm force wind (" + mph + " mph)"; }
	else if ( mph >= 74 ) { return "hurricane force wind (" + mph + " mph)"; }
	else { return mph + " mph wind"; }
}

function getHumidityString(hum) {
	return "The humidity is " + hum + "%.";
}

function getLastXdays(day, month, YYYY) {
	var d = new Date();
	var mondays = [];
	d.setYear(YYYY);
	d.setMonth(MONTHS.indexOf(month));
	d.setDate(1);
	while (d.getUTCDay() !== DAYS.indexOf(day)) {
		d.setDate(d.getUTCDate() + 1);
	}
	while (d.getUTCMonth() === MONTHS.indexOf(month)) {
		mondays.push(d.getTime());
		d.setDate(d.getUTCDate() + 7);
	}
	return parseInt(mondays[mondays.length - 1] / 86400000) * 86400;
}

function getMonthlyWeekday(n, weekday, date) {
	// weekday is the number of the day for example Saturday
	// n is the number of the nth day for example 2 for the 2nd
	// date is a javascript date object for example new Date(2018, 11) for december 2018
	// see: https://stackoverflow.com/a/32193378
	weekday = DAYS.indexOf(weekday);
	date = new Date(date.getUTCFullYear(), date.getMonth(), 1);
	var add = (weekday - date.getUTCDay() + 7) % 7 + (n - 1) * 7;
	date.setDate(1 + add);
	// return (date.getTime() - (date.getTimezoneOffset() * 60000)) / 1000;
	return date.getTime() / 1000;
}

function getOzone(value) {
	var [short, name, colour] = convert_Dobson_to_text(value);
	if ( short == "L" ) { return ""; }
	return "<p>The pollution level is " + name + " ("+ value + " Dobson units).</p>";
}

function getPressures(data, current) {
	var string = [];
	var end = (get_UTCDate() / 1000);
	var start = end - (3600 * 12);
	var pressure_points = get_element(data, 7, start, end, false);
	pressure_points = pressure_points.map(function(i,idx){ return [idx, i];});
	var direction = ss.linearRegression(pressure_points).m;
	var expect = "";
	if ( current != "" ) {
		[expect, direction] = getWeatherFromPressure(current, direction);
		string.push("The pressure is " + current + " mbar and " + direction + ".");
		if ( expect != "" ) { string.push( "Expect " + expect + " for the next 12 hours." ); }
		return "<p>" + string.join(" ").trim() + "</p>";
	}
	return "";
}

function getRelativeTime(epoch) {
	return new Date(epoch * 1000).toRelativeTime({"smartDays": false, "nowThreshold": 60000});
}

function getTemperatureString(TinC, recorded=false, correction=false) {
	if ( recorded != false && correction != false && correction != 0 ) {
		return "<abbr title=\"Recorded value of " + round_to_one(recorded) + "&deg;C (with a correction factor of " + round_to_one(correction) + "&deg;C)\">"  + round_to_one(TinC) + "&deg;C</abbr> / " + round_to_one(Feels.tempConvert(TinC, "c", "f")) + "&deg;F";
	}
	return round_to_one(TinC) + "&deg;C / " + round_to_one(Feels.tempConvert(TinC, "c", "f")) + "&deg;F";
}

// get a colour for the text which will show up on the colour
function getTextColour(temperature_hex) {
	var col = chroma(temperature_hex);
	if ( col.luminance() > 0.179 ) {
		return col.darken(2).hex();
	}
	return col.brighten(4).hex();
}

function getUV(value) {
	var name, colour, advice;
	[value, name, colour, advice] = convertUV(value);
	return "<p>The UV level is " + name + ". "+ advice + "</p>";
}

function sentenceCase(str){
	str = str.toLowerCase().replace(/\si\s/g, ' I ');
	str = str.charAt(0).toUpperCase() + str.slice(1);
	return str;
}

function getVisibility(visibility, cloud_cover) {
	var string = [];
	if ( cloud_cover != "" || cloud_cover == 0 ) {
		cloud_cover = parseInt(cloud_cover);
		if ( ! isNaN(cloud_cover) && cloud_cover <= 100 && cloud_cover >= 0 ) {
			if ( cloud_cover == 0 ) {
				string.push("There are no clouds");
			}
			else {
				string.push( "There is " + cloud_cover + "% cloud cover");
			}
		}
	}
	if ( visibility != "" ) {
		visibility = parseInt(visibility);
		if ( visibility > 0 && visibility < 20 ) {
			string.push( convert_visibility(visibility) + "." );
			string[0] = sentenceCase(string[0]);
			string = [string.join(" and ")];
			string.push( "You can see for " + visibility + " miles" );
		}
	}
	string = string.join(" ").trim();
	if (string.length > 0) {
		return "<p>" + string + ".</p>";
	}
	return "";
}

function getWeatherFromPressure(value, direction) {
	// http://www.barometricpressureheadache.com/barometric-pressure-and-weather-conditions/
	var expect = "";
	if ( direction < -0.25 ) {
		if ( value > 1022 && direction < -0.5 ) {
			expect = "cloudier and warmer conditions";
		}
		else if ( value > 1022  ){
			expect = "fair weather";
		}
		else if ( value < 1010 && direction < -0.5 ) {
			expect = "stormy weather";
		}
		else if ( value < 1010  ){
			expect = "precipitation";
		}
		else if ( direction < -0.5 ) {
			expect = "some precipitation";
		}
		else {
			expect = "little change in the weather";
		}
		direction = "falling";
	}
	else if ( direction > 0.25 ) {
		expect = sub_pressure(value);
		direction = "rising";
	}
	else {
		expect = sub_pressure(value);
		direction = "steady";
	}
	return [expect, direction];
}

function getWindString(wind, gust, direction) {
	var details = {"speed": 0, "gust": false, "direction": ""};
	var string = [ "There is a" ];
	details.speed = Math.max(parseFloat(wind), parseFloat(gust));
	if ( isNaN(details.speed) ) {
		return [0, ""];
	}
	if ( gust >= wind ) { details.gust = true; }
	if ( details.speed > 0 && direction != "" ) { details.direction = direction; }
	if ( details.speed > 2 ) {
		if ( details.gust ) { string.push("gusty"); }
		string.push( getBeaufortScale(details.speed) );
		if ( details.direction != "" && ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"].indexOf(details.direction) != "-1" ) { string.push( "from the " + details.direction ); }
	}
	if ( string.length == 1 ) { string = []; }
	string = string.join(" ").trim();
	if ( string.length > 0 ) { string += "."; }
	return [details.speed,  string];
}

function get_Date(datestring, full=false, length=1) {

	var parts = datestring.split(" ");
	var required = [];
	if (parts[1].length > length) { length = parts[1].length; }
	required.push(zeroPad(parts[1], length));
	required.push(parts[2]);
	if ( full ) { required.push(zeroPad(parts[3], 4)); }
	//TODO
	// var test = Date.parse(datestring);
	// test = new Date(test);
	// console.log(parts)
	// console.log(zeroPad(test.getUTCDate(), 2)+" "+MONTHS[test.getUTCMonth()].slice(0,3))
	// console.log(required.join(" ").trim())
	return required.join(" ").trim();
}

function get_UTCDate() {
	var date = new Date();
	date = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
	return new Date(date);
}

function get_data(place) {
	var place_letter = place.charAt(0).toLowerCase();
	var url = "data/" + place_letter + ".latest";
	// var content = window.getComputedStyle(document.getElementById("content")).getPropertyValue("display");
    var content = "block";
    if (LOCATIONS.length > 1) { content = "grid"; }
	document.getElementById("content").style.display = "none";
	fetch(url, {cache: "no-cache"}).then(function(response) {
		return response.text();
	}).then(function(text) {
		main(place, text);
		document.getElementById("content").style.display = content;
        doBackgroundColour();
	});
}

function get_element(data, required, start, end, withdate=false) {
	data = data.filter( function(el) { if ( ( el[0] >= start && end >= el[0] ) && ( typeof el[required] != "undefined" && el[required] != "" ) ) { return el; } });
	if ( withdate ) { return data.map( function(el) { return [el[0], el[required]]; } ); }
	return data.map(function(el) { return el[required]; });
}

function get_phase(lunar) {
	var phase = [];
	phase.push( moon_phase(lunar[0].phase) );
	phase.push( "moon" );
	phase.push( "with " + Math.round( lunar[0].fraction * 100, 0 ) + "% of it visible" );
	return phase.join(" ").trim();
}

function get_time(which, full=false) {
	var words = [];
	which = new Date(Date.parse(LOCALTIME.format(which)));
	if ( full == true ) {
		words.push(get_Date(which.toString(), true));
	}
	words.push( zeroPad(which.getHours(), 2) + ":" + zeroPad(which.getMinutes(), 2) );
	return words.join(" at ").trim();
}

function is_at(what, when, string, now) {
	if ( now < when ) {
		string.push( what );
		string.push( get_time(when) );
		if ( (when - now) <= 3600000 ) {
			string.push( "(" + when.toRelativeTime() + ")");
		}
	}
	return close_sentence(string);
}

function joinSentence(a) {
	return [a.slice(0, -1).join(", "), a.slice(-1)[0]].join(a.length < 2 ? "" : " and ");
}

function last_updated(when, place) {
	document.getElementById(place + "_updated").innerHTML = "<p>" + toTitleCase(place) + ", " + getRelativeTime(when) + ".</p>";
}

function last_x_days(days, data) {
	var nowtime = get_UTCDate() / 1000;
	var start = 86400 * parseInt(nowtime / 86400) - (86400 * days);
	var end = start + (86400 * days);
	data = get_element(data, 1, start, end);
	return [ss.mean(data), ss.min(data), ss.max(data), ss.standardDeviation(data)];
}

function main(place, text){
	// clear any timeouts
	if ( LAST_UPDATED[place] != null ) {
		window.clearTimeout(LAST_UPDATED[null]);
	}

	if ( LOCATIONS.indexOf(place) == 0 ) { compile_dates(); }
	// reset the page
	document.querySelector("#" + place + " .conditions").innerHTML = "<span class=\"summary\"></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>";
	// get the csv into an array
	// the last line in the data is the line with the records on it, the
	// one before that is the last recorded data
	var [result, records] = fetchCSV(text);
	var latest = result[result.length - 1];
	var correction_factor = find_correction(result, 24);
	if ( isNaN(correction_factor) || correction_factor == null || place == "Nailsea") { correction_factor = 0; }
	if (latest[6] >= latest[1]) { correction_factor = 0; }

	// find out the greatest wind speed and which we are using
	var [wind_speed, wind_string] = getWindString(latest[8], latest[9], latest[10]);

	// process the temperature and humidity and set the page colours
	var background_colour = "#ffffff";
	[background_colour, document.querySelector("#" + place + " .conditions span:nth-child(2)").innerHTML] = processTemperatures(background_colour, latest[1], latest[2], wind_speed, correction_factor, result, [records[4], records[5]], [records[6], records[7]]);
	var text_colour = getTextColour(background_colour);
	BACKGROUND_COLOURS[place] = background_colour;
	document.getElementById(place).style.backgroundColor = background_colour;
	document.getElementById(place + "_updated").style.backgroundColor = background_colour;
	document.getElementById(place).style.color = text_colour;
	document.getElementById(place + "_updated").style.color = text_colour;

	// set the icon
	var skycons = new Skycons({"monochrome": false, "color": text_colour, "resizeClear": true, "colors" : {"sun": "#efd021", "moon": "#ddd"}});
	skycons.remove("icon");
	skycons.add(document.querySelector("#" + place + " .icon"), ICONS[latest[5] - 1]);

	// do these parts
	var fetch = ["summary", "wind", "visibility", "battery", "pressure", "uv", "ozone", "updated"];
	for (var part in fetch) {
		var part_name = fetch[part];
		var idx = AVAILABLE.indexOf(part_name);
		var temp;
		if ( latest[idx] != "" || latest[idx] == 0 ) {
			if ( part_name == "summary" ) {
				if ( latest[idx] == "" ) {
					latest[idx] = "Unknown conditions";
				}
				document.querySelector("#" + place + " .conditions span:nth-child(1)").innerHTML = "<p>" + latest[idx] + "</p>";
			}
			else if ( part_name == "updated" ) {
				last_updated(latest[0], place);
			}
			else if ( part_name == "wind" ) {
				document.querySelector("#" + place + " .conditions span:nth-child(3)").innerHTML = "<p>" + wind_string + "</p>";
			}
			else if ( part_name == "visibility" ) {
				document.querySelector("#" + place + " .conditions span:nth-child(6)").innerHTML = getVisibility(latest[idx], latest[idx - 2]);
			}
			else if ( part_name == "battery" ) {
				if ( latest[idx] != "" ) {
					temp = parseInt(latest[idx]);
					if ( !isNaN(temp) && temp < 30 ) {
						document.querySelector("#header span:nth-child(2)").innerHTML = "<p>&#128267; The battery in " + place + " is getting low - " + latest[idx] + "% remaining</p>";
					}
				}
			}
			else if ( part_name == "uv" ) {
				temp = parseFloat(latest[12]);
				if ( !isNaN(temp) && temp > 0 && temp < 15 ){
					document.querySelector("#" + place + " .conditions span:nth-child(9)").innerHTML = getUV(temp);
				}
			}
			else if ( part_name == "ozone" ) {
				temp = parseFloat(latest[14]);
				if ( !isNaN(temp) && temp > 200 && temp < 1000 ){
					document.querySelector("#" + place + " .conditions span:nth-child(10)").innerHTML = getOzone(temp);
				}
			}
			else if ( part_name == "pressure" ) {
				temp = parseFloat(latest[7]);
				if ( !isNaN(temp) ) {
					document.querySelector("#" + place + " .conditions span:nth-child(4)").innerHTML = getPressures(result, temp);
				}
			}
		}
	}
	do_last_precipitate(place, latest, records);
	astronomy(records[2], records[3], place);
	skycons.play();
	LAST_UPDATED[place] = window.setInterval(function() {
		if ( LOCATIONS.indexOf(place) == 0 ) { compile_dates(); }
		do_last_precipitate(place, latest, records);
		astronomy(records[2], records[3], place);
		last_updated(latest[0], place);
		if ( document.querySelector("#header span:nth-child(2)").innerHTML != "" ) {
			document.querySelector("#header").style.display = "block";
		}
	}, 15000);
}

function moon_phase(phase) {
	if ( phase < 0.05 ) { return "new"; }
	else if ( phase < 0.2 ) { return "waxing cresent"; }
	else if ( phase < 0.3 ) { return "first quarter"; }
	else if ( phase < 0.45 ) { return "waxing gibbous"; }
	else if ( phase < 0.55 ) { return "full"; }
	else if ( phase < 0.7 ) { return "waning gibbous"; }
	else if ( phase < 0.8 ) { return "last quarter"; }
	return "waning cresent";
}

function page_setup() {
	var width = parseInt(window.getComputedStyle(document.body).getPropertyValue("--width"));
	document.getElementById("content").innerHTML = "";
	document.getElementById("content").width = width * LOCATIONS.length;
	document.title = "Weather for " + joinSentence(LOCATIONS);
	var html = document.createElement("section");
	html.setAttribute("id", "header");
	document.getElementById("content").appendChild(html);

	html = document.createElement("span");
	document.getElementById("header").appendChild(html);
	html = document.createElement("span");
	document.getElementById("header").appendChild(html);
	for (var place in LOCATIONS) {
		var place_name = LOCATIONS[place];
		html = document.createElement("section");
		html.setAttribute("id", place_name);
		html.setAttribute("class", "background");
		html.setAttribute("style", "grid-row: 2 / span 1");
		document.getElementById("content").appendChild(html);

		html = document.createElement("canvas");
		html.setAttribute("class", "icon");
		html.setAttribute("width", "128px");
		html.setAttribute("height", "128px");
		document.getElementById(place_name).appendChild(html);

		html = document.createElement("br");
		document.getElementById(place_name).appendChild(html);

		html = document.createElement("article");
		html.setAttribute("class", "conditions");
		document.getElementById(place_name).appendChild(html);

		html = document.createElement("section");
		html.setAttribute("id", place_name + "_updated");
		html.setAttribute("class", "updated");
		html.setAttribute("style", "grid-row: 3 / span 1");
		document.getElementById("content").appendChild(html);
	}
	update_page();
}

function processTemperatures(colour, temperature, humidity, speed, correction, data, coldest, hottest) {
	var string = [];
	if ( ( temperature != "" || temperature == 0 ) && ( humidity != "" && humidity > 0 )  && (typeof temperature != "string" && typeof humidity != "string") ) {
		var config = {
			temp: parseFloat(temperature - correction),
			humidity: parseFloat(humidity),
			speed: speed,
			round: false,
			units: { temp: "c", speed: "mph" }
		};
		var Temperatures = new Feels(config);
		colour = SCALE_TEMPERATURE(Temperatures.like()).hex();
		string.push( "It is " + getTemperatureString(Temperatures.temp, temperature, correction) );
		if ( Temperatures.temp != Temperatures.like() ) {
			string.push( "but it feels like " + getTemperatureString(Temperatures.like()) + "." );
		}
		string.push( getHumidityString(humidity) );
	}
	else if ( typeof temperature == "number" && (temperature != "" || temperature == 0) ) {
		string.push( "It is " + getTemperatureString(temperature) );
	}
	else if ( typeof humidity == "number" && (humidity != "" || humidity == 0) ) {
		string.push( "The humidity is " + getHumidityString(humidity) );
	}
	if (typeof Temperatures !== "undefined" && ( humidity >=0 && humidity <= 100 ) ) {
		var wetness = null;
		var where = null;
		if ( Temperatures.temp <= 0 && Temperatures.temp >= -80 ) {
			if ( (Temperatures.temp <= Temperatures.getFrostPoint()) || (Temperatures.like() <= Temperatures.getFrostPoint() && Temperatures.temp <= 2) ) {
				wetness = "frost";
				where = "ground";
			}
		}
		else if ( (Temperatures.temp <= Temperatures.getDewPoint()) || (Temperatures.like() <= Temperatures.getDewPoint() && Temperatures.temp <= 2) ) {
			if ( Temperatures.temp <= 0 || Temperatures.like() <= 0 ) {
				wetness = "frost";
			}
			else {
				wetness = "dew";
			}
			where = "grass";
		}
		if ( wetness !== null && where !== null ) {
			string.push( "There may be some " + wetness + " on the " + where + "." );
		}
	}
	var today = last_x_days(0, data);
	var comparisons = {"yesterday": 1, "last week": 7, "last month": 28};
	for ( var comparison in comparisons ) {
		var compare = colder_or_hotter(today[0], last_x_days(comparisons[comparison], data), comparison, coldest, hottest);
		if ( compare != "" ) {
			if ( endsWith(compare, "than") ) {
				compare = compare + " " + comparison;
			}
			string.push(compare + "." );
			break;
		}
	}
	return [colour, "<p>" + string.join(" ").trim() + "</p>"];
}

function round_to_one(num) {
	return (Math.round( num * 10) / 10).toFixed(1);
}

function sub_pressure(value) {
	if ( value > 1022 ) { return "continued fair weather"; }
	else if ( value < 1010 ) { return "cooler and clearer weather"; }
	return "the weather to stay the same";
}

function toTitleCase(str) {
	return str.replace(
		/\w\S*/g,
		function(txt) {
			return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
		}
	);
}

function update_page() {
	for (var place in LOCATIONS) {
		// BACKGROUND_COLOURS = [];
		place = LOCATIONS[place];
		get_data(place);
	}
	window.setTimeout(function() {
		location.reload();
	}, 300000);
}

function when_is_easter(Y) {
	var C = Math.floor(Y/100);
	var N = Y - 19*Math.floor(Y/19);
	var K = Math.floor((C - 17)/25);
	var I = C - Math.floor(C/4) - Math.floor((C - K)/3) + 19*N + 15;
	I = I - 30*Math.floor((I/30));
	I = I - Math.floor(I/28)*(1 - Math.floor(I/28)*Math.floor(29/(I + 1))*Math.floor((21 - N)/11));
	var J = Y + Math.floor(Y/4) + I + 2 - C + Math.floor(C/4);
	J = J - 7*Math.floor(J/7);
	var L = I - J;
	var M = 3 + Math.floor((L + 40)/44);
	var D = L + 28 - 31*Math.floor(M/4);
	return (Date.UTC(Y, M-1, D)) / 1000;
}

function zeroPad(num, padlen, padchar) {
	var pad_char = typeof padchar !== "undefined" ? padchar : "0";
	var pad = new Array(1 + padlen).join(pad_char);
	return (pad + num).slice(-pad.length);
}

page_setup();
