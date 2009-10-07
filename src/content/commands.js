/* -*- mode: JavaScript; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*- */
/* ex: set tabstop=4 expandtab: */
/*
 * Copyright (c) 2009 Panagiotis Astithas
 *
 * Permission to use, copy, modify, and distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

var commands;
if (!commands) commands = {};

const Cc = Components.classes;
const Ci = Components.interfaces;

commands.onLoad = function () {
    // Register to receive notifications of preference changes
    var prefs = Cc["@mozilla.org/preferences-service;1"]
        .getService(Ci.nsIPrefService).getBranch("extensions.despin.");
    prefs.QueryInterface(Ci.nsIPrefBranch2);
    prefs.addObserver("", this, false);

    commands.saveOnClose = prefs.getBoolPref("saveOnClose");

    $("#open").click(function(event) {
	commands.open();
    });
    $("#save").click(function(event) {
	commands.save();
    });
    $("#print").click(function(event) {
	commands.print();
    });
    $("#scratch").click(function(event) {
	commands.openScratchpad();
    });
    $("#options").click(function(event) {
	commands.showPreferences();
    });
    commands.resize();
    // Open an empty scratchpad for starters.
    commands.openScratchpad();
    window.addEventListener("resize", commands.resize, false);
    window.addEventListener("unload", commands.onUnload, false);
    if (this.saveOnClose)
        this.setAutoSave();
}

commands.onUnload = function () {
    var prefs = Cc["@mozilla.org/preferences-service;1"]
        .getService(Ci.nsIPrefService).getBranch("extensions.despin.");
    prefs.removeObserver("", this);
}

commands.observe = function (subject, topic, data) {
    var prefs = Cc["@mozilla.org/preferences-service;1"]
        .getService(Ci.nsIPrefService).getBranch("extensions.despin.");
    if (topic != "nsPref:changed")
        return;

    switch(data) {
    case "saveOnClose":
        this.saveOnClose = prefs.getBoolPref("saveOnClose");
        if (this.saveOnClose)
            this.setAutoSave();
        else
            this.removeAutoSave();
        break;
    }
}

commands.open = function () {
    var nsIFilePicker = Ci.nsIFilePicker;
    var picker = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    picker.init(window, "Select file", nsIFilePicker.modeOpen);
    var result = picker.show();

    if (result == nsIFilePicker.returnOK) {
	    commands.load(picker.file.path);
    }

    return result == nsIFilePicker.returnOK;
}

commands.save = function () {
    commands.editor.save();
}

commands.print = function () {
}

commands.openScratchpad = function () {
    var file = DirIO.get('ProfD');
    file.append("despin-scratchpad");
    if (!file.exists())
      FileIO.create(file);
    commands.load(file.path);
}

commands.showPreferences = function () {
    window.openDialog("chrome://despin/content/options.xul", "preferences",
        "chrome,resizable,centerscreen,modal,dialog");
}

commands.load = function (path) {
    var separator;
    if (window.navigator && window.navigator.oscpu.indexOf("Windows") != -1)
        separator = path.lastIndexOf('\\');
    else
        separator = path.lastIndexOf('/');
    var filename = (separator === -1) ? path : path.substring(separator + 1, path.length);
    var editor = new Editor(path);
    // Store the reference to the editor.
    commands.editor = editor;
    
    document.title = filename + " (" + path + ")";
    editor.initUI('editor', window);
}

commands.resize = function () {
    // Resize the editor to fill the window.
    $("#editor").height($(document).height() - $("#toolbar").outerHeight(true));
}

commands.setAutoSave = function () {
    window.addEventListener("blur", this.onBlur, false);
    window.addEventListener("unload", this.onBlur, false);
}

commands.removeAutoSave = function () {
    window.removeEventListener("blur", this.onBlur, false);
    window.removeEventListener("unload", this.onBlur, false);
}

commands.onBlur = function () {
    commands.editor.save();
}
