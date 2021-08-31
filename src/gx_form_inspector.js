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
        const gx_control_att = 'data-gx-control-name';
        const initialize_gx_object = function(gxo) {
				if (gxo && gxo.GXCtrlIds) {
                    gxo.GXCtrlIds.map( i => {
                        let vStruct = gxo.GXValidFnc[i];
                        if (vStruct){
                            let gxName = '';
                            if (vStruct.fld) {
                                if (vStruct.gxvar) {
                                    //Genexus Var or Att
                                    let bIsVar = vStruct.gxvar.startsWith('AV');
                                    gxName = `${(bIsVar?'&':'')}${vStruct.gxvar.replace(/^AV?\d*/, '')}` ;
                                }
                                else {
                                    gxName = vStruct.fld;
                                }
                                let rExp = new RegExp(`(span_)?${gxo.CmpContext}${vStruct.fld}(_([0-9]{4})*)?$`);
                                $('[id]').filter(function() {return $(this)[0].id.match(rExp)}).attr(gx_control_att, gxName.toLowerCase());
                            }
                        }
                    });
					for (wc in gxo.CmpControls) {
						$(`#${gxo.CmpContext}gxHTMLWrp${gxo.CmpControls[wc].Prefix}`).attr(gx_control_att, gxo.CmpControls[wc].id.toLowerCase())
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
        let targets = gx.$(selector);

        ret = gx.$.map( targets, function( target) {
            let cmpElement = gx.$(target).closest('[class=gxwebcomponent]').map( (i,el) => {
					const gxCtrlName = gx.$(el).attr( gx_control_att);
                    //let stripCmpName = id => id.replace(/^gxHTMLWrp/,''); // unused variables
                    //let id = el.id;
					return (!gxobjectWC || gxobjectWC.toLowerCase() === gxCtrlName) ?
						{	isComponent: target === el,
							cmpctrl_gxid: gxCtrlName, 
						}:null;
                }
            );
            let inMasterPage = target.id.endsWith('_MPAGE');
            if (cmpElement.length === 0) {
                return gxobjectWC ? null :
						[{	inMasterPage: inMasterPage, 
							id:target.id, 
							isComponent:false,
							value: target.value,
							text: target.textContent
						}];
			}
			else {
                return [{	inMasterPage: inMasterPage, 
							id:target.id, 
							cmpctrl_gxid:cmpElement[0].cmpctrl_gxid,
							isComponent:cmpElement[0].isComponent,
							value: target.value,
							text: target.textContent
						}];
            }
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

            //const wcFilter = wc => !gxobjectWC || wc.ServerClass === gxobjectWC.toLowerCase() ? wc : null; // changed for the following IE compatible filter
            var wcFilter = function wcFilter(wc) {
                var components = gx.forminspector(gxobjectWC.toLowerCase());
                return gxobjectWC && components.length > 0 && components[0].id.endsWith(wc.CmpContext) ? wc : null;
            };

            const gFilter = g => ((g.realGridName.toLowerCase() === ctrl_gxid.toLowerCase()) && (!row || (g.parentRow.gxId === row))) ? g : null;
            const wcGrids = gx.pO.WebComponents.filter(wcFilter).map( wc => wc.Grids).flat();
            const mpGrids = gx.pO.MasterPage ? gx.pO.MasterPage.Grids : [];
            let Grids = (!gxobjectWC ? gx.pO.Grids : []).concat(wcGrids).concat(mpGrids);
            /*const retObj = g =>	{
                return {
                    id: g.getContainerControl().id ,
                    cmp: g.parentObject?.CmpContext || "",
                    rows: g.grid.rows.length,
                    inMasterPage: g.parentObject?.IsMasterPage || false,
                }
            };*/ // Changed for the IE compatible function
            var retObj = function retObj(g) {
                var _g$parentObject;
                var closestWC = gx.$("#" + g.getContainerControlId()).closest('[class=gxwebcomponent]');
                var wcId = closestWC.length > 0 ? closestWC[0].id : "";
                var wcName = wcId ? gx.$("#" + wcId).attr('data-gx-control-name') : "";
                if (!gxobjectWC || wcName.toLowerCase() === gxobjectWC.toLowerCase()) {
                    return {
                        id: g.getContainerControlId(),
                        cmpctrl_gxid: wcName,
                        rows: g.grid.rows.length,
                        inMasterPage: (_g$parentObject === void 0 ? void 0 : _g$parentObject.IsMasterPage) || false
                    };
                }
            };
            return Grids.filter( gFilter).map(retObj);
        }
    }
})