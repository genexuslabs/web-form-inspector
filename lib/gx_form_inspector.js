"use strict";

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
window.addEventListener("load", function () {
  gx.forminspector = function (ctrl_gxid, row, gxobjectWC) {
    var gx_control_att = 'data-gx-control-name';

    var initailize_gx_object = function initailize_gx_object(gxo) {
      gxo.GXCtrlIds.map(function (i) {
        var vStruct = gxo.GXValidFnc[i];

        if (vStruct) {
          var gxName = '';

          if (vStruct.fld) {
            if (vStruct.gxvar) {
              //Genexus Var or Att
              var bIsVar = vStruct.gxvar.startsWith('AV');
              gxName = "".concat(bIsVar ? '&' : '').concat(vStruct.gxvar.replace(/^AV?\d*/, ''));
            } else {
              gxName = vStruct.fld;
            }

            var rExp = new RegExp("(span_)?".concat(gxo.CmpContext).concat(vStruct.fld, "(_([0-9]{4})*)?"));
            $('[id]').filter(function () {
              return $(this)[0].id.match(rExp);
            }).attr(gx_control_att, gxName.toLowerCase());
          }
        }
      });
    };

    var _init = function _init() {
      if (!gx.forminspector._initialized) {
        initailize_gx_object(gx.O);
        initailize_gx_object(gx.pO.MasterPage);
        gx.O.WebComponents.map(function (gxComponent) {
          return initailize_gx_object(gxComponent);
        });
        gx.fx.obs.addObserver('webcom.render', gx.forminspector, function (gxComponent) {
          return initailize_gx_object(gxComponent);
        });
        gx.forminspector._initialized = true;
      }
    };

    _init();

    var srow = row ? gx.text.padl(row.toString(), 4, '0') : undefined;
    var selector = "[".concat(gx_control_att, "=\"").concat(ctrl_gxid.toLowerCase(), "\"]");

    if (row) {
      selector = "[data-gxrow=\"".concat(srow, "\"] ") + selector;
    }

    var targets = gx.$(selector);
    var filterPrefixWC = gxobjectWC ? gx.O.WebComponents.filter(function (wc) {
      return wc.ServerClass === gxobjectWC.toLowerCase();
    }) : [];
    ret = gx.$.map(targets, function (target) {
      var cmpElement = gx.$(target).closest('[class=gxwebcomponent]').map(function (i, el) {
        var stripCmpName = function stripCmpName(id) {
          return id.replace(/^gxHTMLWrp/, '');
        };

        var id = el.id;

        if (filterPrefixWC.length > 0) {
          var match = filterPrefixWC.filter(function (wc) {
            return id.endsWith(wc.CmpContext);
          });

          if (match.length > 0) {
            return stripCmpName(match[0].CmpContext);
          }
        } else {
          return stripCmpName(id);
        }
      }).get().join();
      var inMasterPage = target.id.endsWith('_MPAGE');

      if (!gxobjectWC || cmpElement.length > 0) {
        return [{
          inMasterPage: inMasterPage,
          cmp: cmpElement || "",
          id: target.id,
          value: target.value || target.textContent
        }];
      }
    });
    return ret;
  };
});