//gx.forminspector(ctrl_gxid, row, gxobjectWC)
//ctrl_gxid is the control name as defined in Genexus
//row is a optional filter in case that the selected control is in a grid level
//gxobjectWC is an optional filter to do the search over a specific Genexus WebComponent
//Return: array of objects with each instance of the control with the specified GXId in the HTML form

//Each element has the form 
//"inMasterPage":boolean
//"cmp":string(id) if the controls is not in a component this value will be empty
//"id":string(controlDOMId)
//"value":string(controlvalue)

// IE polyfills
if (!Array.prototype.flat) {
    Array.prototype.flat = function(depth) {
        var flattened = [];
        (function flat(array, depth) {
            for (let el of array) {
            if (Array.isArray(el) && depth > 0) {
                flat(el, depth - 1);
            } else {
                flattened.push(el);
            }
        }
        })(this, Math.floor(depth) || 1);
        return flattened;
    };
}

if (!String.prototype.endsWith) {
  String.prototype.endsWith = function (search, this_len) {
      if (this_len === undefined || this_len > this.length) {
          this_len = this.length;
      }
      return this.substring(this_len - search.length, this_len) === search;
  };
}

if (!String.prototype.startsWith) {
  Object.defineProperty(String.prototype, 'startsWith', {
      value: function (search, rawPos) {
          var pos = rawPos > 0 ? rawPos | 0 : 0;
          return this.substring(pos, pos + search.length) === search;
      }
  });
}

///////
window.addEventListener("load", () => {
    gx.forminspector = function (ctrl_gxid, row, gxobjectWC) {
		const gx_control_att = 'data-gx-control-name',
			gx_cmp_prefix_att = 'data-gx-cmp-prefix',
			gx_prompt_att = 'data-gx-prompt-name',
  		    gx_control_type_att = 'data-gx-control-type';
		const initialize_gx_object = function(gxo) {
				if (gxo && gxo.GXCtrlIds) {
                    gxo.GXCtrlIds.map( i => {
                        let vStruct = gxo.GXValidFnc[i];
                        if (vStruct){
                            let gxName = '';
                            if (vStruct.fld) {
                                if (vStruct.gxvar && !vStruct.v2bc) {
                                    //Genexus Var or Att
                                    let bIsVar = vStruct.gxvar.startsWith('AV');
                                    gxName = `${(bIsVar?'&':'')}${vStruct.gxvar.replace(/^AV?\d*/, '')}` ;
                                }
                                else {
                                    gxName = vStruct.fld;
                                }
                                let rExp = new RegExp("^(span_)?".concat(gxo.CmpContext).concat(vStruct.fld, "(_([0-9]{4})*)?$")),
                                    prompt = gx.attachedControls.filter(function (attC) {
                                        return attC.info.isPrompt && attC.info.controls.slice(-1) == vStruct.id;
                                    });
                                $('[id]').filter(function () {
                                    return $(this)[0].id.match(rExp);
                                })
                                .attr(gx_control_att, gxName.toLowerCase())
                                .attr(gx_prompt_att, function() {
                                    return prompt.length ? prompt[0].id : null;
                                })
                                .attr(gx_control_type_att, vStruct.type);
                                $('input[type=radio]')
                                .filter(function () {
                                return $(this)[0].name.match(rExp);
                                })
                                .attr(gx_control_att, gxName.toLowerCase());
                            }
                        }
                    });
					for (let wc in gxo.CmpControls) {
						$(`#${gxo.CmpContext}gxHTMLWrp${gxo.CmpControls[wc].Prefix}`)
							.attr(gx_control_att, gxo.CmpControls[wc].id.toLowerCase())
							.attr(gx_cmp_prefix_att, gxo.CmpControls[wc].Prefix);
					}
				}					
        };
        const _init = () => {
            if (!gx.forminspector._initialized) {
                initialize_gx_object( gx.pO);
                initialize_gx_object( gx.pO.MasterPage);
                gx.pO.WebComponents.map( gxComponent => initialize_gx_object( gxComponent));
                gx.fx.obs.addObserver('webcom.render', gx.forminspector, gxComponent => initialize_gx_object( gxComponent));
                gx.forminspector._initialized = true;
            }
        };

        _init();

        let srow = (row)?gx.text.padl(row.toString(), 4, '0'):undefined;
        let selector = `[${gx_control_att}="${ctrl_gxid.toLowerCase()}"]`;
        if (row) {
            selector = `[data-gxrow="${srow}"] ` + selector;
        }

        let targets = gx.$(`${selector}`),
        visibleTargets;
	
	    if (targets.length > 1 && targets.attr(gx_control_type_att) !== 'bits') {
            visibleTargets = gx.$(`${selector}:visible`);

            if (visibleTargets.length > 0) {
                targets = visibleTargets;
            }
	    }
		
    	const targetValue = (target, gxO) => {
            const excludedInputTypes = ['file']; 
            if (target.tagName && target.tagName.toLowerCase() === 'input' && excludedInputTypes.indexOf(target.type) < 0) {
                const id = target.type === 'radio' ? target.name : target.id;
                return gx.fn.getControlValue_impl(id, undefined, gxO).toString();
            }
        	return target.value;
    	};

        let ret = gx.$.map( targets, function( target) {
            let 	inMasterPage = target.id.endsWith('_MPAGE'),
					cmpElementsArr = gx.$(target).closest('[class=gxwebcomponent]').map( (i,el) => {
							const gxCtrlName = gx.$(el).attr( gx_control_att);
							return (!gxobjectWC || gxobjectWC.toLowerCase() === gxCtrlName) ?
								{	isComponent: target === el,
									cmpctrl_gxid: gxCtrlName, 
									cmpprefix: gx.$(el).attr(gx_cmp_prefix_att)
								}:null;
						}
					),
					cmpElement = cmpElementsArr.length ? cmpElementsArr[0] : undefined,
					gxO = cmpElement ? cmpElement : (inMasterPage ? gx.pO.MasterPage : gx.pO),
					prompt = target.getAttribute(gx_prompt_att),
                    prompt_row = target.id.match(/([0-9]{4})+/),
                    prompt_row_id = prompt_row ? `_${prompt_row[0]}` : '',
                    prompt_id = prompt ? `${prompt}${prompt_row_id}`:undefined,
    				el = {
    					inMasterPage, 
    					id:target.id,
    					text: target.textContent,
    				},
    				ballonEl;
            if (prompt_id) {
                el.prompt = prompt_id;
            }
            el.isEnabled = !(target.hasAttribute('data-gx-readonly') || target.classList.contains('gx-disabled'));
            if (!cmpElement || cmpElement.length === 0) {
                el = gxobjectWC ? null : 
                    [
                        {	...el,
                            validationText: ( ballonEl = $(`#${el.id}_Balloon`), ballonEl.is(':visible') ? ballonEl.text() : '' ),
              				value: targetValue(target, gxO),
                            text: target.textContent,
                            isComponent:false
                        }
                    ];
			}
			else {
				gxO = gx.O.WebComponents[cmpElement.cmpprefix];
                el = [
                        {	...el,
							cmpctrl_gxid:cmpElement.cmpctrl_gxid,
							value: targetValue(target, gxO),
                            text: target.textContent,
							isComponent:cmpElement.isComponent
					    }
                    ];
            }
            return el;
        });
		gx.$(ret).each(function(i, el) {
  	  		let nRows = gx.$(`#${el.id} tr, #${el.id} div[class=row], #${el.id} div[data-gx-smarttable-cell], #${el.id} div[data-gx-canvas-cell]`).length;
	  	  	if ( !el.isComponent && nRows > 0) {
		  	  	el.rows = nRows;
			    }
    	});
        return ret;
    }

    gx.inspector = {
        messages: function() {
            //Return array of GX messages (msg) in form
            return $.map($(".gx_ev, .ErrorMessages, .WarningMessages"), (n,i) => { const $n = $(n); return ($n.text().length > 0) ? $n.text() : null})
        },
        elements: function( opts) {
            //opts is an object with properties:
            //ctrl_gxid is the control name as defined in Genexus (Required)
            //row is a optional filter in case that then selected control is in a grid level (Optional)
            //gxobjectWC is an optional filter to do the search over a specific Genexus WebComponent (Optional)
            const {ctrl_gxid = "", row = "", gxobjectWC = ""} = opts;
            return gx.forminspector(ctrl_gxid, row, gxobjectWC).concat(gx.inspector.grids(opts));
        },
        grids: function( opts) {
            //opts is an object with properties:
            //ctrl_gxid is the control name as defined in Genexus (Required)
            //row is a optional filter in case that then selected control is in a grid level (Optional)
            //Row number shold be of length 4 with '0'left padding
            //0001001 row1 at parent row1 - 00010002 row2 at parent row1
            //gxobjectWC is an optional filter to do the search over a specific Genexus WebComponent (Optional)
            const {ctrl_gxid = "", row = "", gxobjectWC = ""} = opts;

            const wcFilter = wc => {
                let components = gx.forminspector(gxobjectWC.toLowerCase());
                return gxobjectWC && components.length > 0 && components[0].id.endsWith(wc.CmpContext) ? wc : null;
            };

            const gFilter = g => ((g.realGridName.toLowerCase() === ctrl_gxid.toLowerCase()) && (!row || (g.parentRow.gxId === row))) ? g : null,
                wcGrids = gx.pO.WebComponents.filter(wcFilter).map( wc => wc.Grids).flat(),
                mpGrids = gx.pO.MasterPage ? gx.pO.MasterPage.Grids : [],
                Grids = (!gxobjectWC ? gx.pO.Grids : []).concat(wcGrids).concat(mpGrids),
                retObj = g => {
                    let closestWC = gx.$("#" + g.getContainerControlId()).closest('[class=gxwebcomponent]'),
                        wcId = closestWC.length > 0 ? closestWC[0].id : "";
                        wcName = wcId ? gx.$("#" + wcId).attr('data-gx-control-name') : "";
                    if (!gxobjectWC || wcName.toLowerCase() === gxobjectWC.toLowerCase()) {
                        return {
                            id: g.getContainerControlId(),
                            cmpctrl_gxid: wcName,
                            rows: g.grid.rows.length,
                            inMasterPage: g.parentObject?.IsMasterPage || false
                        };
                    }
                };
            return Grids.filter( gFilter).map(retObj);
        }
    }
})
