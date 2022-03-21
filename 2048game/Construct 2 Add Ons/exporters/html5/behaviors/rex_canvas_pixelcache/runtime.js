// ECMAScript 5 strict mode
"use strict";

assert2(cr, "cr namespace not created");
assert2(cr.behaviors, "cr.behaviors not created");

/////////////////////////////////////
// Behavior class
cr.behaviors.Rex_Canvas_PixelCahce = function(runtime)
{
	this.runtime = runtime;
};

(function ()
{
	var behaviorProto = cr.behaviors.Rex_Canvas_PixelCahce.prototype;
		
	/////////////////////////////////////
	// Behavior type class
	behaviorProto.Type = function(behavior, objtype)
	{
		this.behavior = behavior;
		this.objtype = objtype;
		this.runtime = behavior.runtime;
	};
	
	var behtypeProto = behaviorProto.Type.prototype;

	behtypeProto.onCreate = function()
	{  
	};

	/////////////////////////////////////
	// Behavior instance class
	behaviorProto.Instance = function(type, inst)
	{
		this.type = type;
		this.behavior = type.behavior;
		this.inst = inst;
		this.runtime = type.runtime;
	};
	
	var behinstProto = behaviorProto.Instance.prototype;

	behinstProto.onCreate = function()
	{
        if (!this.recycled)    
        {
            this.cache = new window.RexC2PixelCache(this.inst);
        }
        else
        {
            this.cache.reset(this.inst);
        }
        
	    this.exp_CurX = 0;
	    this.exp_CurY = 0;      
	};  

	behinstProto.onDestroy = function ()
	{		
	     this.cache.reset(); 
	};
	
	behinstProto.tick = function ()
	{	
	};
   
	behinstProto.saveToJSON = function ()
	{    
		return { "c": this.cache.saveToJSON(),
		         };
	};
	
	behinstProto.loadFromJSON = function (o)
	{
        this.cache.loadFromJSON(o["c"]); 
    };	
    
	//////////////////////////////////////
	// Conditions
	function Cnds() {};
	behaviorProto.cnds = new Cnds();

	Cnds.prototype.ForEachPoint = function (direction)
	{
        var runtime = this.runtime;        
        var current_frame = runtime.getCurrentEventStack();
        var current_event = current_frame.current_event;
		var solModifierAfterCnds = current_frame.isModifierAfterCnds();

        var self = this;
        var callback = function(x, y)
        {
            if (solModifierAfterCnds)
                runtime.pushCopySol(current_event.solModifiers);
             
             self.exp_CurX = x;	
             self.exp_CurY = y;

		    current_event.retrigger();
		    
            if (solModifierAfterCnds)
		        runtime.popSol(current_event.solModifiers);
        }
        
        this.cache.ForEachPoint(direction, callback);    
        return false;
    };    
	//////////////////////////////////////
	// Actions
	function Acts() {};
	behaviorProto.acts = new Acts();
	
	Acts.prototype.CacheArea = function (x, y, w, h)
	{	
        this.cache.read(x, y, w, h);
	};
	
	Acts.prototype.WriteBack = function ()
	{	
        this.cache.write();
	};	
    
	Acts.prototype.SetR = function (x, y, val)
	{	
        this.cache.setR(x, y, val);
	};
    
	Acts.prototype.SetG = function (x, y, val)
	{	
        this.cache.setG(x, y, val);
	};   
    
	Acts.prototype.SetB = function (x, y, val)
	{	
        this.cache.setB(x, y, val);
	};
    
	Acts.prototype.SetA = function (x, y, val)
	{	
        this.cache.setA(x, y, val);
	}; 
    
	Acts.prototype.SetRGBA = function (x, y, r, g, b, a)
	{	
        this.cache.setRGBA(x, y, r, g, b, a);
	};    
	//////////////////////////////////////
	// Expressions
	function Exps() {};
	behaviorProto.exps = new Exps();

	Exps.prototype.rgbaAt = function (ret, x, y)
	{
		var r = this.cache.getR(x, y);
        var g = this.cache.getG(x, y);
        var b = this.cache.getB(x, y);
        var a = this.cache.getA(x, y)/255;
		ret.set_string("rgba(" + r.toString() + "," + g.toString() + "," + b.toString() + "," + a.toString() + ")");
	};

    Exps.prototype.redAt = function (ret, x, y)
	{
		ret.set_int(this.cache.getR(x, y));
	};
    Exps.prototype.greenAt = function (ret, x, y)
	{
		ret.set_int(this.cache.getG(x, y));
	};
   Exps.prototype.blueAt = function (ret, x, y)
	{
		ret.set_int(this.cache.getB(x, y));
	};
    Exps.prototype.alphaAt = function (ret, x, y)
	{
		ret.set_float(this.cache.getA(x, y)/255);
	};	
	
    Exps.prototype.LeftX = function (ret)
	{
		ret.set_int(this.cache.area_lx);
	};	
    Exps.prototype.RightX = function (ret)
	{
		ret.set_int(this.cache.area_rx);
	};
	Exps.prototype.TopY = function (ret)
	{
		ret.set_int(this.cache.area_ty);
	};	
    Exps.prototype.BottomY = function (ret)
	{
		ret.set_int(this.cache.area_by);
	};

	Exps.prototype.CurX = function (ret)
	{
		ret.set_int(this.exp_CurX);
	};
    
	Exps.prototype.CurY = function (ret)
	{
		ret.set_int(this.exp_CurY);
	};
    
	Exps.prototype.CurR = function (ret)
	{
		ret.set_int(this.cache.getR(this.exp_CurX, this.exp_CurY));
	};
    
	Exps.prototype.CurG = function (ret)
	{
		ret.set_int(this.cache.getG(this.exp_CurX, this.exp_CurY));
	};     
    
	Exps.prototype.CurB = function (ret)
	{
		ret.set_int(this.cache.getB(this.exp_CurX, this.exp_CurY));
	};
    
	Exps.prototype.CurA = function (ret)
	{
		ret.set_float(this.cache.getA(this.exp_CurX, this.exp_CurY)/255);
	};    
    
        
}());


(function ()
{
    // general pick instances function
    if (window.RexC2PixelCache != null)
        return;
    
	var PixelCache = function(inst)
	{
	    this.reset(inst);
	};  

	var PixelCacheProto = PixelCache.prototype;    
    
	PixelCacheProto.reset = function (inst)
	{
        this.canvas_inst = inst;
	    this.img_data = null;
		this.area_lx = 0;
		this.area_rx = 0;
		this.area_ty = 0;
		this.area_by = 0;
	};	
    
	PixelCacheProto.read = function (x, y, w, h)
	{
	    if (x == null)
		{
		    x = 0; 
			y = 0; 
			w = this.canvas_inst.canvas.width; 
			h = this.canvas_inst.canvas.height;
	    }
			
        this.img_data = this.canvas_inst.ctx.getImageData(x, y, w, h);
		this.area_lx = x;
		this.area_ty = y;
		this.area_rx = x+w-1;
		this.area_by = y+h-1;
	};	
    
	PixelCacheProto.write = function ()
	{	
        this.canvas_inst.ctx.putImageData(this.img_data, this.area_lx, this.area_ty);
	};	    
    
	PixelCacheProto.getWidth = function ()
	{	
        return this.area_rx - this.area_lx;
	};    
    
	PixelCacheProto.getHeight = function ()
	{	
        return this.area_by - this.area_ty;
	};    

	PixelCacheProto.getPointIndex = function (x,y)
	{	
	    if (this.img_data === null)
		    this.read();
        if ( (x < this.area_lx) || (x > this.area_rx) ||
		     (y < this.area_ty) || (y > this.area_by) )
			return -1;
	    
		x -= this.area_lx;
		y -= this.area_ty;
        return ((y*this.img_data.width) + x) * 4;
	};	
    
    PixelCacheProto.getData = function (i)
	{
		var data = this.img_data.data;
		var val = data[i];
		if (val == null)
		    val = 0;

	    return val;
	};	
    
    PixelCacheProto.getR = function (x, y)
	{
		var i = this.getPointIndex(x, y);
		if (i === -1)		
			return 0;
		
        return this.getData(i);
	};
    
    PixelCacheProto.getG = function (x, y)
	{
		var i = this.getPointIndex(x, y);
		if (i === -1)		
			return 0;
		
        return this.getData(i+1);
	}; 
    
    PixelCacheProto.getB = function (x, y)
	{
		var i = this.getPointIndex(x, y);
		if (i === -1)		
			return 0;
		
        return this.getData(i+2);
	};     
    
    PixelCacheProto.getA = function (x, y)
	{
		var i = this.getPointIndex(x, y);
		if (i === -1)		
			return 0;
		
        return this.getData(i+3);
	};          
    
    PixelCacheProto.setColor = function (i, val)
	{        
		var data = this.img_data.data;
        data[i] = val;	    
	};	    
    
	PixelCacheProto.setR = function (x, y, val)
	{	
		var i = this.getPointIndex(x, y);
		if (i == -1)
			return;
        
        val = cr.clamp(Math.floor(val), 0, 255);
        this.setColor(i, val);
	};
    
	PixelCacheProto.setG = function (x, y, val)
	{	
		var i = this.getPointIndex(x, y);
		if (i == -1)
			return;
        
        val = cr.clamp(Math.floor(val), 0, 255);
        this.setColor(i+1, val);
	};   
    
	PixelCacheProto.setB = function (x, y, val)
	{	
		var i = this.getPointIndex(x, y);
		if (i == -1)
			return;
        
        val = cr.clamp(Math.floor(val), 0, 255);
        this.setColor(i+2, val);
	};
    
	PixelCacheProto.setA = function (x, y, val)
	{	
		var i = this.getPointIndex(x, y);
		if (i == -1)
			return;
        
        val = Math.floor(cr.clamp(val, 0, 1) *255);
        this.setColor(i+3, val);
	};    

	PixelCacheProto.setRGBA = function (x, y, r, g, b, a)
	{	
		var i = this.getPointIndex(x, y);
		if (i == -1)
			return;
        
        r = cr.clamp(Math.floor(r), 0, 255);
        this.setColor(i, r);
        g = cr.clamp(Math.floor(g), 0, 255);
        this.setColor(i+1, g);  
        b = cr.clamp(Math.floor(b), 0, 255);
        this.setColor(i+2, r);
        a = Math.floor(cr.clamp(a, 0, 1) *255);
        this.setColor(i+3, a);  
	};    

	PixelCacheProto.ForEachPoint = function (direction, cb)
	{
	    if (this.img_data === null)
		    this.read();

        var h =  this.getHeight();   // [0 - ymax]
        var w =  this.getWidth();    // [0 - xmax]
        var px, py;        
        // Top to bottom, or Bottom to top -> y axis
        if ((direction === 0) || (direction === 1))        
        {

		    for (var y=0; y<=h; y++ )
	        {
                py =  this.area_ty;
	            py += (direction === 0)? y : (h - y);
                
	            for (var x=0; x<=w; x++ )
	            {
                    px =  this.area_lx + x;	

		    	    cb(px, py);
		        }
		    }
        }
        
        // Left to right, or Right to left -> x axis
        else if ((direction === 2) || (direction === 3))        
        {
		    for (var x=0; x<=w; x++ )
	        {
                px = this.cache.area_lx;	
	            px = (direction === 2)? x : (w - x);
                
	            for (var y=0; y<=h; y++ )
	            {
                    py = this.cache.area_ty + y;	 

		    	    cb(px, py);
		        }
		    }
        }           
    };        
    

    var __arr = [];
	PixelCacheProto.saveToJSON = function ()
	{    
        var CHUNK_SZ = 0x8000;
        for (var i=0; i < u8a.length; i+=CHUNK_SZ) 
        {
            __arr.push(String.fromCharCode.apply(null, u8a.subarray(i, i+CHUNK_SZ)));
        }
        var s = __arr.join("");
        __arr.length = 0;
        
		return { "d": btoa(s),
		             "lx": this.area_lx,
		             "rx": this.area_rx,
		             "ty": this.area_ty,
		             "by": this.area_by,
		         };
	};
	
	PixelCacheProto.loadFromJSON = function (o)
	{
		this.area_lx = o["lx"];
		this.area_rx = o["rx"];
		this.area_ty = o["ty"];
		this.area_by = o["by"];

        var unit8Array = atob(o["d"]).split("");
        var h = this.getHeight();
        var w = this.getWidth();   
           
	    this.img_data = this.canvas_inst.ctx.createImageData(w, h);
        var data = this.img_data.data;
        var cnt = data.length;
        for(var i=0; i<=cnt; i++)        
            data[i] = unit8Array[i];      
    };	    
        
    window.RexC2PixelCache = PixelCache;        
}());