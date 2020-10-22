"use strict";

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

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
// IE polyfill 
if (!Array.prototype.flat) {
  Array.prototype.flat = function (depth) {
    var flattend = [];

    (function flat(array, depth) {
      var _iterator = _createForOfIteratorHelper(array),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var el = _step.value;

          if (Array.isArray(el) && depth > 0) {
            flat(el, depth - 1);
          } else {
            flattend.push(el);
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    })(this, Math.floor(depth) || 1);

    return flattend;
  };
} ///////


window.addEventListener("load", function () {
  gx.forminspector = function (ctrl_gxid, row, gxobjectWC) {
    var gx_control_att = 'data-gx-control-name';

    var initailize_gx_object = function initailize_gx_object(gxo) {
      gxo && gxo.GXCtrlIds && gxo.GXCtrlIds.map(function (i) {
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

            var rExp = new RegExp("(span_)?".concat(gxo.CmpContext).concat(vStruct.fld, "(_([0-9]{4})*)?$"));
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

  gx.inspector = {
    messages: function messages() {
      //Return array of GX messages (msg) in form
      return $.map($(".gx_ev"), function (n, i) {
        var $n = $(n);
        return $n.text().length > 0 ? $n.text() : null;
      });
    },
    elements: function elements(opts) {
      //opts is an object with properties:
      //ctrl_gxid is the control name as defined in Genexus (Required)
      //row is a optional filter in case that then selected control is in a grid level (Optional)
      //gxobjectWC is an optional filter to do the search over a specific Genexus WebComponent (Optional)
      var _opts$ctrl_gxid = opts.ctrl_gxid,
          ctrl_gxid = _opts$ctrl_gxid === void 0 ? "" : _opts$ctrl_gxid,
          _opts$row = opts.row,
          row = _opts$row === void 0 ? "" : _opts$row,
          _opts$gxobjectWC = opts.gxobjectWC,
          gxobjectWC = _opts$gxobjectWC === void 0 ? "" : _opts$gxobjectWC;
      return gx.forminspector(ctrl_gxid, row, gxobjectWC);
    },
    grids: function grids(opts) {
      //opts is an object with properties:
      //ctrl_gxid is the control name as defined in Genexus (Required)
      //row is a optional filter in case that then selected control is in a grid level (Optional)
      //Row number shold be of length 4 with '0'left padding 
      //0001001 row1 at parent row1 - 00010002 row2 at parent row1
      //gxobjectWC is an optional filter to do the search over a specific Genexus WebComponent (Optional)
      var _opts$ctrl_gxid2 = opts.ctrl_gxid,
          ctrl_gxid = _opts$ctrl_gxid2 === void 0 ? "" : _opts$ctrl_gxid2,
          _opts$row2 = opts.row,
          row = _opts$row2 === void 0 ? "" : _opts$row2,
          _opts$gxobjectWC2 = opts.gxobjectWC,
          gxobjectWC = _opts$gxobjectWC2 === void 0 ? "" : _opts$gxobjectWC2;

      var wcFilter = function wcFilter(wc) {
        return !gxobjectWC || wc.ServerClass === gxobjectWC.toLowerCase() ? wc : null;
      };

      var gFilter = function gFilter(g) {
        return g.realGridName === ctrl_gxid && (!row || g.parentRow.gxId === row) ? g : null;
      };

      var wcGrids = gx.O.WebComponents.filter(wcFilter).map(function (wc) {
        return wc.Grids;
      }).flat();
      var mpGrids = gx.O.MasterPage ? gx.O.MasterPage.Grids : [];
      var Grids = (!gxobjectWC ? gx.O.Grids : []).concat(wcGrids).concat(mpGrids);

      var retObj = function retObj(g) {
        var _g$parentObject, _g$parentObject2;

        return {
          id: g.getContainerControl().id,
          cmp: ((_g$parentObject = g.parentObject) === null || _g$parentObject === void 0 ? void 0 : _g$parentObject.CmpContext) || "",
          rows: g.grid.rows.length,
          InMasterPage: ((_g$parentObject2 = g.parentObject) === null || _g$parentObject2 === void 0 ? void 0 : _g$parentObject2.IsMasterPage) || false
        };
      };

      return Grids.filter(gFilter).map(retObj);
    }
  };
});