﻿// ECMAScript 5 strict mode
"use strict";

assert2(cr, "cr namespace not created");
assert2(cr.plugins_, "cr.plugins_ not created");

// pretend to be firebase api
window["Firebase"] = window["Wilddog"];  
    
/////////////////////////////////////
// Plugin class
cr.plugins_.Rex_WilddogAPI = function(runtime)
{
	this.runtime = runtime;    
};

(function ()
{
	var pluginProto = cr.plugins_.Rex_WilddogAPI.prototype;
		
	/////////////////////////////////////
	// Object type class
	pluginProto.Type = function(plugin)
	{
		this.plugin = plugin;
		this.runtime = plugin.runtime;
	};
	
	var typeProto = pluginProto.Type.prototype;

	typeProto.onCreate = function()
	{
	};
	
	/////////////////////////////////////
	// Instance class
	pluginProto.Instance = function(type)
	{
		this.type = type;
		this.runtime = type.runtime;
	};
	
	var instanceProto = pluginProto.Instance.prototype;

	instanceProto.onCreate = function()
	{        
        if (!this.recycled)
            window["Firebase"]["enableLogging"](this.properties[0] == 1);
	};
	
	instanceProto.onDestroy = function ()
	{		
	};

	//////////////////////////////////////
	// Conditions
	function Cnds() {};
	pluginProto.cnds = new Cnds();      

	//////////////////////////////////////
	// Actions
	function Acts() {};
	pluginProto.acts = new Acts();
    
	//////////////////////////////////////
	// Expressions
	function Exps() {};
	pluginProto.exps = new Exps();
	
}());