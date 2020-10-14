//gx.forminspector(ctrl_gxid, row, gxobjectWC)
//ctrl_gxid is the control name as defined in Genexus
//row is a optional filter in case that then selected control is in a grid level
//gxobjectWC is an optional filter to do the search over a specific Genexus WebComponent
//Return: array of objects with each instance of the control with the specified GXId in the HTML form

//Each element has the form 
//"inMasterPage":boolean
//"cmp":string(id) if the controls is not in a component this value will be empty
//"id":string(controlDOMId)
//"value":string(controlvalue)

window.addEventListener("load", () => {
	
	gx.forminspector = function (ctrl_gxid, row, gxobjectWC) {
		const gx_control_att = 'data-gx-control-name';
		const initailize_gx_object = function(gxo) {
				(gxo &&
					gxo.GXCtrlIds &&
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
					})
				);
		};
		const _init = () => {
			if (!gx.forminspector._initialized) {
				initailize_gx_object( gx.O);
				initailize_gx_object( gx.pO.MasterPage);
				gx.O.WebComponents.map( gxComponent => initailize_gx_object( gxComponent));
				gx.fx.obs.addObserver('webcom.render', gx.forminspector, gxComponent => initailize_gx_object( gxComponent));
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
		let filterPrefixWC = gxobjectWC ? gx.O.WebComponents.filter((wc) => wc.ServerClass === gxobjectWC.toLowerCase()) : [];
		
		ret = gx.$.map( targets, function( target) {
			let cmpElement = gx.$(target).closest('[class=gxwebcomponent]').map( (i,el) => {
					let stripCmpName = id => id.replace(/^gxHTMLWrp/,'');
					let id = el.id;
					if (filterPrefixWC.length > 0) {
						let match = filterPrefixWC.filter((wc) => id.endsWith(wc.CmpContext));
						if (match.length > 0) {
							return stripCmpName(match[0].CmpContext);
						}
					}
					else {
						return stripCmpName(id);
					}
				}
			).get().join();
			let inMasterPage = target.id.endsWith('_MPAGE');
			if (!gxobjectWC || cmpElement.length > 0) {
				return [{inMasterPage: inMasterPage, cmp: cmpElement || "", id:target.id , value:target.value || target.textContent}];
			}
		});
		return ret;
	};
	gx.inspector = {
		formmessages: function() {
			//Return array of GX messages (msg) in form
			return $.map($("[class='gx_ev']"), (n,i) => { const $n = $(n); return ($n.text().length > 0) ? $n.text() : null})
		},
		formelements: function( opts) {
			//opts is an object with properties:
			//ctrl_gxid is the control name as defined in Genexus (Required)
			//row is a optional filter in case that then selected control is in a grid level (Optional)
			//gxobjectWC is an optional filter to do the search over a specific Genexus WebComponent (Optional)
			const {ctrl_gxid = "", row = "", gxobjectWC = ""} = opts;
			return gx.forminspector(ctrl_gxid, row, gxobjectWC);
		}
	}
})