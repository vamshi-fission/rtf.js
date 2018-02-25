/*

The MIT License (MIT)

Copyright (c) 2016 Tom Zoehner
Copyright (c) 2018 Thomas Bluemel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

import { Helper, EMFJSError } from './Helper';
import { Blob } from './Blob';
import { GDIContext } from './GDIContext';
import { EMFRecords } from './EMFRecords';

export class Renderer {
    _img;

    constructor(blob) {
        this.parse(blob);
        Helper.log("EMFJS.Renderer instantiated");
    }

    parse(blob) {
        this._img = null;

        var reader = new Blob(blob);

        var type = reader.readUint32();
        if(type !== 0x00000001){
            throw new EMFJSError("Not an EMF file");
        }
        var size = reader.readUint32();
        if (size % 4 != 0)
            throw new EMFJSError("Not an EMF file");

        this._img = new EMF(reader, size);

        if (this._img == null)
            throw new EMFJSError("Format not recognized");
    };

    _render(svg, mapMode, w, h, xExt, yExt) {
        var gdi = new GDIContext(svg);
        gdi.setWindowExtEx(w, h);
        gdi.setViewportExtEx(xExt, yExt);
        gdi.setMapMode(mapMode);
        Helper.log("[EMF] BEGIN RENDERING --->");
        this._img.render(gdi);
        Helper.log("[EMF] <--- DONE RENDERING");
    };

    render(info) {
        var inst = this;
        var img = (function(mapMode, w, h, xExt, yExt) {
            return (<any>$("<div>")).svg({
                onLoad: function(svg) {
                    return inst._render.call(inst, svg, mapMode, w, h, xExt, yExt);
                },
                settings: {
                    viewBox: [0, 0, xExt, yExt].join(" "),
                    preserveAspectRatio: "none" // TODO: MM_ISOTROPIC vs MM_ANISOTROPIC
                }
            });
        })(info.mapMode, info.wExt, info.hExt, info.xExt, info.yExt);
        var svg = (<any>$(img[0])).svg("get");
        return $(svg.root()).attr("width", info.width).attr("height", info.height);
    };
};

export class EMF {
    _reader;
    _hdrsize;
    _img;
    _records;

    constructor(reader, hdrsize) {
        this._reader = reader;
        this._hdrsize = hdrsize;
        this._img = null;
        this._records = new EMFRecords(reader, this._hdrsize);
    }

    render(gdi) {
        this._records.play(gdi);
    };
};