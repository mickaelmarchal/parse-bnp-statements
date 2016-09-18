
var xml = require('node-xml');
var _ = require('lodash');
var fs = require('fs');

var line = {};
var lineStarted = false;
var hasAmountForLine = false;
var desc = '';


var csv = [];

var currentTop = null;
var currentLeft = null;

var amountTop = null;
var debitParts = [];
var creditParts = [];



var parser = new xml.SaxParser(function(cb) {
    cb.onStartDocument(function() {

    });
    cb.onEndDocument(function() {

    	//write CSV to disk
    	var file = '';
    	_.forEach(csv, function(line) {
    		file += '"'+line.date+'","'+line.description+'","'+(line.debit ? line.debit : '')+'","'+(line.credit ? line.credit : '')+'"\n';
    	});

    	fs.writeFile("out.csv", file, function(err) {
    		if(err) {
        		return console.log(err);
    		}
    		console.log("The file was saved!");
		});

		//console.log('done');
		//console.log(JSON.stringify(csv));
    });
    cb.onStartElementNS(function(elem, attrs, prefix, uri, namespaces) {
  		if(elem == 'text') {
  			var top = attrs[0][1];
	        var left = attrs[1][1];
	        if(top && left) {
	        	currentTop = top;
	        	currentLeft = left;
	        }
  		}
  	});
  	cb.onEndElementNS(function(elem, prefix, uri) {
	  	if(elem == 'text') {
	      currentTop = null;
	      currentLeft = null;
	    }
  	});
  	cb.onCharacters(function(chars) {
  		if(currentTop && currentLeft) {

/*
<text top="352" left="31" width="37" height="12" font="8">05 . 12</text>
<text top="352" left="585" width="37" height="12" font="8">05 . 12</text>
<text top="352" left="85" width="275" height="12" font="8">PRLV xxxxxxxxxxxxxx</text>
<text top="370" left="85" width="181" height="12" font="8">EMETTEUR/FRxxxxxxx</text>
<text top="388" left="85" width="217" height="12" font="8">MDT/xxxxxxx</text>
<text top="406" left="85" width="83" height="12" font="8">REF/xxxxxxxxx</text>
<text top="406" left="720" width="15" height="12" font="8">00</text>
<text top="406" left="714" width="4" height="12" font="8">,</text>
<text top="406" left="698" width="15" height="12" font="8">10</text>
*/

	        //detect dates
	        var resDate = chars.match(/([0-9]{2}) *\. *([0-9]{2})/);

	        //date + debut d'un nouvel item
	        if(currentLeft < 50 && resDate) {

				////////////////////fin de la ligne précédente
				line.description = desc;

				//compile le montant
				//line.debit = parseFloat(debitParts.reverse().join('').replace(".", "").replace(",","."));
				//line.credit = parseFloat(creditParts.reverse().join('').replace(".", "").replace(",","."));
				line.debit = debitParts.reverse().join('').replace(".", "");
				line.credit = creditParts.reverse().join('').replace(".", "");


				//ajoute la ligne dans le CSV
				if(line.debit || line.credit) {
					csv.push(line);
				}
	      	    console.log(JSON.stringify(line));
				console.log('--------');

				/////////////////////debut de la nouvelle ligne
	            line = {};
	            line.date = resDate[1]+'/'+resDate[2];
	            lineStarted = true;
	            desc = '';
	            hasAmountForLine = false;
	        }

 	        //valeur
			else if(lineStarted && currentLeft > 500 && currentLeft < 600 && resDate) {
	      	    line.valeur = resDate[1]+'/'+resDate[2];
	        }

  	        //nature des operations
	        else if(lineStarted && currentLeft > 50 && currentLeft < 500) {
	        	desc += chars + " ";
	        }


	        //debit
	        else if(lineStarted && currentLeft > 650 && currentLeft < 750) {

				if(! amountTop || Math.abs(amountTop - currentTop) > 10) {

					if(! hasAmountForLine) {
						//demarre le montant
						debitParts = [];
						creditParts = [];
						amountTop = currentTop;

						debitParts.push(chars);
						hasAmountForLine = true;
					}
				} else {
					debitParts.push(chars);
				}
	        }

	        //credit
	        else if(lineStarted && currentLeft > 750 && currentLeft < 900) {
				if(! amountTop || Math.abs(amountTop - currentTop) > 10) {

					if(! hasAmountForLine) {
						//demarre le montant
						debitParts = [];
						creditParts = [];
						amountTop = currentTop;
						creditParts.push(chars);
						hasAmountForLine = true;
					}
				} else {
					creditParts.push(chars);
				}
	        }

			//catch all
 	        else {
                //console.log('LINE: '+currentTop+','+currentLeft+': '+chars);
 	        }
        }
    });
});

var xml = parser.parseFile('pdf.xml');
