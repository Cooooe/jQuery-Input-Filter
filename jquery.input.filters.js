var filters = (function(window, $) {

	var Utils = (function() {
		return {
			formatLocal: function() {
				var RegNotNum = /[^0-9]/g;
				var RegPhonNum = "";
				var DataForm = "";

				if (str == "" || str == null)
					return "";
				// delete not number
				str = str.replace(RegNotNum, '');
				if (str.length < 4)
					return str;

				if (str.length > 3 && str.length < 7) {
					DataForm = "$1-$2";
					RegPhonNum = /([0-9]{3})([0-9]+)/;
				} else if (str.length == 7) {
					DataForm = "$1-$2";
					RegPhonNum = /([0-9]{3})([0-9]{4})/;
				} else if (str.length == 8) {
					DataForm = "$1-$2";
					RegPhonNum = /([0-9]{4})([0-9]{4})/;
				} else if (str.length == 9) {
					DataForm = "$1-$2-$3";
					RegPhonNum = /([0-9]{2})([0-9]{3})([0-9]+)/;
				} else if (str.length == 10) {
					if (str.substring(0, 2) == "02") {
						DataForm = "$1-$2-$3";
						RegPhonNum = /([0-9]{2})([0-9]{4})([0-9]+)/;
					} else {
						DataForm = "$1-$2-$3";
						RegPhonNum = /([0-9]{3})([0-9]{3})([0-9]+)/;
					}
				} else if (str.length > 10) {
					DataForm = "$1-$2-$3";
					RegPhonNum = /([0-9]{3})([0-9]{4})([0-9]+)/;
				}

				while (RegPhonNum.test(str)) {
					str = str.replace(RegPhonNum, DataForm);
				}
				
				return str;
			},
			toFixed: function() {
				var divideNum = 1;

				if ( isNaN(parseFloat(value)) ) {
					return NaN;
				}

				for ( var i = 0; i < decimals; i ++ ) {
					divideNum *= 10;
				}

			    return Math.floor(divideNum * parseFloat(value)) / divideNum;
			},
			removeCommas: function() {
				return x.replace(/\,/gi, '');
			}
		}
	})();

	var filterDictornary = {
		n: '\\d',
		e: 'A-Za-z',
		h: '가-힣ㄱ-ㅎㅏ-ㅣ\\ᆢ\\ᆞ',
		s: '\\s',
		t: '`!@#$%\\^&\\*\\(\\)\\_\\+\\-\\=\\[\\]\\;\'\\,\\.\\/\\{\\}\\|\\:\\"\\<\\>\\?"\\~\\\\',
		a: '\\d\\,',
		f: '\\d\\.{0,1}'
	};

	var maskDictornary = {
		amount: function(str) {
			str = str.replace(/[^\d]+/g, '');
			str = str.replace(/^0?/, '');

			if ( isNaN(str) ) {
				return '';
			}

			return str.replace(/(\d)(?=(?:\d{3})+(?!\d))/g, '$1,');
		},

		floatLimit: function(str, len) {

			var dotCount = str.match(/\./g) ? str.match(/\./g).length : 0,
				removeText = str.split('.')[str.split('.').length -1],
				removeRegExp = new RegExp('\.' + removeText + '$');

			if ( dotCount > 1 ) {
				str = str.replace(removeRegExp, '');
			}

			if ( dotCount > 0 && removeText.length > len) {
				return Utils.toFixed(parseFloat(str), len);
			} else {
				return str;
			}
		},

		tel: function(str) {
			return Utils.formatLocal(str);
		}
	};

	function getCaretPosition(elem) {
		var input = elem.get(0),
			korRegExp = new RegExp('^[' + filterDictornary.h + ']+', 'gi'),
			inputFilter =  elem.data('filter');

		if (!input) return; 
			if ('selectionStart' in input) {
				var selectionIndex = input.selectionStart,
					lastInputKorChar;

				if ( inputFilter.indexOf('h') > -1 ) {
					lastInputKorChar = elem.val().substring(selectionIndex-1, selectionIndex);
				} else {
					lastInputKorChar = elem.val().substring(selectionIndex, selectionIndex + 1);
				}

				if ( korRegExp.test(lastInputKorChar) ) {
					return selectionIndex + 1;
				}

				return selectionIndex;
				
		} else if (document.selection) {
			
			input.focus();
			var sel = document.selection.createRange(),
				selLen = document.selection.createRange().text.length;

			sel.moveStart('character', -input.value.length);

			return sel.text.length - selLen;
		}
	}

	function setCaretPosition(elem, caretPos) {
		var input = elem.get(0);

		if(input != null) {
			if(input.createTextRange) {
				var range = input.createTextRange();
				range.move('character', caretPos);
				range.select();
			}
			else {
				if(input.selectionStart) {
					input.focus();
					input.setSelectionRange(caretPos, caretPos);
				}
			else
				input.focus();
			}
		}
	}


	var set = function(input) {
		var inputList = input ? input : $('input[data-filter]'),
			inputCount = inputList.length,
			inputItem,
			_filters = filters;

		for ( var i = 0; i < inputCount; i ++ ) {
			inputItem = $(inputList[i]);
			
			var regExp = '',
				filterList = inputItem.data('filter').match(/[a-z]/gi),
				filterString = _.reduce(filterList, function(memo, filter){ 
					memo += filterDictornary[filter];

					return memo;
				}, ''),

				maskingRule = maskDictornary[inputItem.data('masking')],
				maskingExt = inputItem.data('maskingExt');

			(function(_f, _fs, _mr, _me) {
				if ( !_fs ) {
					return;
				}

				var _regExp = new RegExp('^[' + _fs + ']+', 'gi'),
					_reverseReg = new RegExp('[^' + _fs + ']+', 'gi'),
					isBackspace = false;

				inputItem.data('completedData', inputItem.val());

				inputItem.on('keydown', function(e) {
					if ( e.keyCode == 8 ) {
						isBackspace = true;
					} else {
						isBackspace = false;
					}
				});

				inputItem.on('input', function(e) {
					

					var f = _f;
					
					var that = $(this),
						val = that.val(),
						replaceData = val.replace(_regExp, ''),
						removeViolation = that.val().replace(_reverseReg, ''),
						completedData = that.data('completedData'),
						isBackRemove = false;


					if ( isBackspace ) {

						var removeValComma = '',
							removeCompletedDataComma = '';

						
						if ( f.indexOf('a') > -1 || f.indexOf('f') > -1 ) {
							removeValComma = Utils.removeCommas(val);
							removeCompletedDataComma = Utils.removeCommas(completedData);
						}

						
						if ( that.data('masking') == 'tel' ) {
							removeValComma = val.replace(/\-/gi, '');
							removeCompletedDataComma = completedData.replace(/\-/gi, '');
						}

						if ( _mr ) {	

							
							if ( removeValComma.length == removeCompletedDataComma.length ) {
								var caretPos = getCaretPosition(that);

								
								val = val.slice(0, caretPos-1) + val.slice(caretPos);
								replaceData = val.replace(_regExp, '');
								removeViolation = val.replace(_reverseReg, '');

								isBackRemove = true;
							}
						}
					}

					if (replaceData == '' && (!(that.data('completedData')) || val.length >= that.data('completedData').length) || isBackspace) {
					 	
					 	that.data('completedData', removeViolation);
					}

					if ( val != that.data('completedData') ) {
						removeViolation = that.data('completedData');
					}

					if ( replaceData != '' ) {
						

						if ( removeViolation == undefined ) {
							removeViolation = '';
						}
						
						var caretPos = getCaretPosition(that),
							replaceValue = removeViolation.toString();

						
						if ( replaceValue.length != that.val().length ) {
							caretPos = caretPos + (replaceValue.length - that.val().length);
						}

						if ( isNaN(caretPos) ) {
							caretPos = replaceValue.length;
						}

						that.val(removeViolation);
						val = removeViolation;
 
						if ( !_mr ) {
							setCaretPosition(that, caretPos);
						}
					}

					
					if ( _mr ) {
						
						var caretPos = getCaretPosition(that),
							replaceValue = _mr(val, _me).toString();

						if ( replaceValue.length != val.length ) {
							caretPos = caretPos + (replaceValue.length - val.length);
						}

						if ( isNaN(caretPos) ) {
							caretPos = replaceValue.length;
						}

						
						if ( isBackRemove ) {
							caretPos = caretPos - 1;
						}

						that.val(replaceValue);

						setCaretPosition(that, caretPos);
					}
				});
			})(filterList, filterString, maskingRule, maskingExt);
		}
	};

	return {
		set: set
	}

})(window, $);

$(function() {
	filters.set();
});