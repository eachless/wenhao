﻿// ECMAScript 5 strict mode
"use strict";

assert2(cr, "cr namespace not created");
assert2(cr.plugins_, "cr.plugins_ not created");

/////////////////////////////////////
// Plugin class
cr.plugins_.Rex_MiniBoard = function(runtime)
{
	this.runtime = runtime;
};

(function ()
{
	var pluginProto = cr.plugins_.Rex_MiniBoard.prototype;
		
	pluginProto.onCreate = function ()
	{
		pluginProto.acts.Destroy = function ()
		{
			this.runtime.DestroyInstance(this);
            
            // destroy all chess instances in this miniboard
		    var uid, inst;
		    for (uid in this.items)
		    {
		        inst = this.uid2inst(uid);
		        if (inst == null)
		            continue;
		        this.runtime.DestroyInstance(inst);
		    }
            this.ResetBoard();
		};        
	};		
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
	    this.layout = null;	
	    this.layoutUid = -1;	
	};
   
	/////////////////////////////////////
	// Instance class
	pluginProto.Instance = function(type)
	{
		this.type = type;
		this.runtime = type.runtime;
	};
	
	var instanceProto = pluginProto.Instance.prototype;

    var GINSTGROUP;
    var _uids = [];  // private global object
	instanceProto.onCreate = function()
	{
	    this.check_name = "BOARD";
	    this.is_pin_mode = (this.properties[1] === 1);
        this.pre_POX = this.x;
		this.pre_POY = this.y;
        this.is_putting_request_accepted = false;

        // mainboard ref
        if (!this.recycled)		
        {		
		    this.mainboard = new MainboardRefKlass(this.runtime);
		    this.mainboard_last = new MainboardRefKlass(this.runtime);              
        }

		this.ResetBoard();

        if (!this.recycled)		
        {
		    this.myDestroyCallback = (function (self) {
											return function(inst) {
												self.onInstanceDestroyed(inst);
											};
										})(this); 
	    }
	    
        this.runtime.addDestroyCallback(this.myDestroyCallback); 
		this.runtime.tick2Me(this); 

        this.exp_RequestLX = (-1);		
        this.exp_RequestLY = (-1);
        this.exp_RequestLZ = (-1);   
        this.exp_RequestChessUID = (-1);
        this.exp_RequestMainBoardUID = (-1);
        this.is_putable = 0;
		this._kicked_chess_uid = -1;	
        
	};
	
    instanceProto.GetLayout = function()
    {
        if (this.type.layout != null)
            return this.type.layout;
            
        var plugins = this.runtime.types;
        var name, inst;
        for (name in plugins)
        {
            inst = plugins[name].instances[0];
            
            if ( (cr.plugins_.Rex_SLGSquareTx && (inst instanceof cr.plugins_.Rex_SLGSquareTx.prototype.Instance)) ||
                 (cr.plugins_.Rex_SLGHexTx && (inst instanceof cr.plugins_.Rex_SLGHexTx.prototype.Instance))       ||
                 (cr.plugins_.Rex_SLGCubeTx && (inst instanceof cr.plugins_.Rex_SLGCubeTx.prototype.Instance)) 
                )
            {
                this.type.layout = inst;
                return this.type.layout;
            }            
        }
        assert2(this.type.layout, "Mini board: Can not find layout oject.");
        return null;
    }; 	
	
	instanceProto.ResetBoard = function (ignore_recycle)
	{
		this.board = {};
        
        // uid2xyz
        if ((this.items == null) || ignore_recycle)
		    this.items = {};  
        else
            window.RexC2BoardLXYZCache.freeLinesInDict(this.items);

		this.mainboard.Reset();
		this.mainboard_last.Reset();  
		this.uid2pdxy = {};
	};	
	
	instanceProto.mainboard_ref_set = function (inst, lx, ly)
	{
	    this.mainboard.SetBoard(inst, lx, ly);
        if (inst != null)
        {
            this.mainboard_last.SetBoard(inst, lx, ly);
        }
	};
	
	instanceProto.onInstanceDestroyed = function (inst)
	{
		this.RemoveChess(inst.uid);
		
		// remove board instance
		if (this.mainboard.inst === inst)
		{
		    this.mainboard.SetBoard(null);
		    this.mainboard_last.SetBoard(null);
		}
	};
    
	instanceProto.onDestroy = function ()
	{
		this.runtime.removeDestroyCallback(this.myDestroyCallback);        	    	
	};
	instanceProto.chess_pin = function ()
	{
	    var POX=this.x, POY=this.y;	
		if ((POX == this.pre_POX) && (POY == this.pre_POY))
		    return;
			
		var uid, inst, pdxy;
		for (uid in this.items)
		{
		    inst = this.uid2inst(uid);
		    if (inst == null)
		        continue;
		    pdxy = this.uid2pdxy[uid];
		    inst.x = POX + pdxy.x;	        
			inst.y = POY + pdxy.y;
			inst.set_bbox_changed();
		}
        this.pre_POX = POX;
		this.pre_POY = POY;
	};
		
	instanceProto.add_uid2pdxy = function(inst)
	{
	    var uid = inst.uid;
	    if (!this.uid2pdxy.hasOwnProperty(uid))
	    {
	        this.uid2pdxy[uid] = {x:0,y:0};
	    }
	        
	    this.uid2pdxy[uid].x = inst.x - this.x;
	    this.uid2pdxy[uid].y = inst.y - this.y;   
	};
		 
	instanceProto.tick2 = function ()
	{
	    if (this.is_pin_mode)
	        this.chess_pin();  // pin
	};    
	
	instanceProto.draw = function(ctx)
	{
	};
	
	instanceProto.drawGL = function(glw)
	{
	};

	instanceProto.xyz2uid = function(x, y, z)
	{
	    var tmp = this.board[x];
		if (tmp != null)
		{
		    tmp = tmp[y];
			if (tmp != null)
			    return tmp[z];
		}
		return null;
	};
	
	instanceProto.uid2xyz = function(uid)
	{
	    return this.items[uid];
	};
	
	instanceProto.uid2inst = function(uid)
	{
        uid = parseInt(uid);
        if (typeof(uid) !== "number")
            return null;
        else if (uid < 0)
            return null;
	    else if (this.uid2xyz(uid) == null)  // not on the board
	        return null;
	    else
	        return this.runtime.getObjectByUID(uid);
	};

	instanceProto.add_to_board = function(x, y, z, uid)
	{	   
	    if (!this.board.hasOwnProperty(x))
		    this.board[x] = {};
        var tmpx = this.board[x];
		if (!tmpx.hasOwnProperty(y))
		    tmpx[y] = {};
	    var tmpy = tmpx[y];
		tmpy[z] = uid;
	};	
	
	instanceProto.remove_from_board = function(x, y, z)
	{
		if (!this.board.hasOwnProperty(x))
		    return;		    
        var tmpx = this.board[x];
		if (!tmpx.hasOwnProperty(y))
		    return;
	    var tmpy = tmpx[y];	    
		if (!tmpy.hasOwnProperty(z))
		    return;	
		    	    
		delete tmpy[z];		
		if (is_hash_empty(tmpy))
		    delete tmpx[y];
		if (is_hash_empty(tmpx))
		    delete this.board[x];
	};	

	instanceProto.RemoveChess = function(uid, kicking_notify)
	{
        if (uid == null)
            return;

        var _xyz = this.uid2xyz(uid);
        if (_xyz == null)
            return;
        
        var inst = this.uid2inst(uid);
        if (kicking_notify && inst)
        {
            get_extra_info(inst)["minb_uid"] = null;
            this._kicked_chess_uid = uid;
            this.runtime.trigger(cr.plugins_.Rex_SLGBoard.prototype.cnds.OnChessKicked, this); 
        }

        window.RexC2BoardLXYZCache.freeLine(this.items[uid]);
        delete this.items[uid];
        this.remove_from_board(_xyz.x, _xyz.y, _xyz.z);
        delete this.uid2pdxy[uid];        
	};
	
	var get_extra_info = function (inst)
	{
	    if (!inst.extra.hasOwnProperty("rex_minb"))
	        inst.extra["rex_minb"] = {};
	    return inst.extra["rex_minb"];
	};
	
	instanceProto.AddChess = function(inst, lx, ly, lz)
	{
        if (inst == null)
            return;
			
        // "inst" could be instance(object) or uid(number) or ?(string)
        var inst_is_inst = (typeof(inst) === "object");
        var uid = (inst_is_inst)? inst.uid:inst;

        this.RemoveChess(uid);  // keep unique uid (symbol)            
        this.RemoveChess(this.xyz2uid(lx, ly, lz), true);
		this.add_to_board(lx, ly, lz, uid);
        this.items[uid] = window.RexC2BoardLXYZCache.allocLine(lx, ly, lz);
        
        // try get inst from uid
        inst = this.uid2inst(uid);
        if (inst)
        {
	        get_extra_info(inst)["minb_uid"] = this.uid;    
	        this.add_uid2pdxy(inst);                        
        }            
	};
	
	instanceProto.CreateChess = function(obj_type, lx, ly, lz, layer)
	{
	    var layout = this.GetLayout();
        if ( (obj_type ==null) || (layout == null) )
            return;
            
	    var pox_save = layout.GetPOX();
		var poy_save = layout.GetPOY();
		layout.SetPOX(this.x);
		layout.SetPOY(this.y);
        
        // callback
        var self = this;  
        var __callback = function (inst)
        {
            self.AddChess(inst, lx, ly, lz); 
        }
        // callback          
        var inst = window.RexC2CreateObject.call(this, obj_type, layer, 
                                                 layout.LXYZ2PX(lx, ly, lz), 
                                                 layout.LXYZ2PY(lx, ly, lz), 
                                                 __callback);
                

		layout.SetPOX(pox_save);
		layout.SetPOY(poy_save);
	    return inst;
	};
	    
	instanceProto.CellIsInside = function (board_inst, chess_uid, lx, ly, lz)
	{
		return board_inst.IsInsideBoard(lx, ly);
	};	 
	
	instanceProto.CellIsEmpty = function (board_inst, chess_uid, lx, ly, lz)
	{
		if ( !board_inst.IsInsideBoard(lx, ly) )
		    return false;
				
	    return board_inst.IsEmpty(lx, ly, lz);
	};	
	
	instanceProto.CellIsPutable = function (board_inst, chess_uid, lx, ly, lz)
	{
		if ( !board_inst.IsInsideBoard(lx, ly) )
		    return false;
		
		this.is_putable = false;
		this.exp_RequestChessUID = chess_uid;
		this.exp_RequestMainBoardUID = board_inst.uid;
		this.exp_RequestLX = lx;
		this.exp_RequestLY = ly
	    this.exp_RequestLZ = lz;
	    this.runtime.trigger(cr.plugins_.Rex_MiniBoard.prototype.cnds.OnPutAbleRequest, this);
	    
	    return this.is_putable;
	};	
	
	// export
	instanceProto.CellCanPut = function (board_inst, chess_uid, lx, ly, lz, test_mode)
	{	
        // uid is not a symbol
        if (!isNaN(chess_uid))
            chess_uid = parseInt(chess_uid);
                
	    var cell_can_put;
	    switch (test_mode)
	    {
	    case 0:  cell_can_put = true;   break;
	    case 1:  cell_can_put = this.CellIsInside(board_inst, chess_uid, lx, ly, lz);   break;
	    case 2:  cell_can_put = this.CellIsEmpty(board_inst, chess_uid, lx, ly, lz);   break; 
	    case 3:  cell_can_put = this.CellIsPutable(board_inst, chess_uid, lx, ly, lz);   break;  
	    default: cell_can_put = this.CellIsEmpty(board_inst, chess_uid, lx, ly, lz);   break;   	       
	    }
	    return cell_can_put;
	}; 	
	
	instanceProto.CanPut = function (board_inst, offset_lx, offset_ly, test_mode)
	{	    
	    if (board_inst == null)
	        return false;
	        
	    if (test_mode == 0)
	        return true;
        
        var layout = board_inst.GetLayout();
		var uid, xyz, lx, ly, lz;
		for (uid in this.items)
		{		    
		    xyz = this.uid2xyz(uid);
		    lx = layout.OffsetLX(xyz.x, xyz.y, 0, offset_lx, offset_ly, 0);
		    ly = layout.OffsetLY(xyz.x, xyz.y, 0, offset_lx, offset_ly, 0);
		    lz = xyz.z;

		    if (!this.CellCanPut(board_inst, uid, lx, ly, lz, test_mode))
		        return false;
		}
		return true;
	}; 			
	
	instanceProto.PutChess = function (board_inst, offset_lx, offset_ly, 
	                                   test_mode, is_pos_set, is_put_test, 
	                                   ignore_put_request)
	{	    
	    if (board_inst == null)
	        return;
	        
        this.PullOutChess();
        
        var is_success = this.CanPut(board_inst, offset_lx, offset_ly, test_mode);  
        if (is_success && (!is_put_test))
        {
            // put on main board logically
            this.mainboard_ref_set(board_inst, offset_lx, offset_ly);       
                
		    var uid, xyz, inst;
		    var layout = board_inst.GetLayout();
		    for (uid in this.items)
		    {
		        xyz = this.uid2xyz(uid);
                
                // uid is not a symbol
                if (!isNaN(uid))
                    uid = parseInt(uid);
                
		    	board_inst.AddChess(uid,
		    	                    layout.OffsetLX(xyz.x, xyz.y, 0, offset_lx, offset_ly, 0), 
		    	                    layout.OffsetLY(xyz.x, xyz.y, 0, offset_lx, offset_ly, 0),  
		    	                    xyz.z);
		    }
            
            // put on main board physically
            if (is_pos_set)
            {
                var mainboard_layout = board_inst.GetLayout();
		        this.x = mainboard_layout.LXYZ2PX(offset_lx, offset_ly, 0);
		        this.y = mainboard_layout.LXYZ2PY(offset_lx, offset_ly, 0);
		        this.chess_pin();
            }
        }
        if (ignore_put_request !== true)
            this.do_putting_request(is_success);
        return is_success;
	};
    
    instanceProto.do_putting_request = function(can_put)
    {
        this.is_putting_request_accepted = can_put;           
        var trig = (can_put)? cr.plugins_.Rex_MiniBoard.prototype.cnds.OnPuttingRequestAccepted:
                              cr.plugins_.Rex_MiniBoard.prototype.cnds.OnPuttingRequestRejected;
        this.runtime.trigger(trig, this);
    };      
	
	instanceProto.PullOutChess = function ()
	{	 
	    var mainboard = this.mainboard.inst; 
	    if (mainboard == null)
		    return;
        
		var uid;
		for (uid in this.items)
		{
            // uid is not a symbol
            if (!isNaN(uid))
                uid = parseInt(uid);
                    
			mainboard.RemoveChess(uid);
        }
        
        this.mainboard_ref_set(null);
	};
	
    // transfer miniboard 
	instanceProto.TransferMiniboard = function (options)
	{
	    var miniboard = this.inst;
	    var is_on_mainboard = (this.mainboard.inst != null);
	    if (!is_on_mainboard)	    
	        options.checkMode = null;
	        
	    if (is_on_mainboard)
	    {
	        this.PullOutChess();	
	    }

	    var new_items = this.do_logical_transfer(options);
	    var is_success = (new_items != null);
	    if (is_success && (!options.isTest))
	    {
	        this.lxyz_reset(new_items);
	        if (options.isSetPosition)
	            this.chess_position_reset();
	    }
	    
	    if (is_on_mainboard)
	    {	    
	        this.PutChess(this.mainboard_last.inst, // board_inst
	                      this.mainboard_last.LOX,  // offset_lx
	                      this.mainboard_last.LOY,  // offset_ly
	                      false,                    // test_mode
	                      null,                     // is_pos_set
	                      null,                     // is_put_test
	                      true                      // ignore_put_request	    
	                      );                                                       
	    }
        if (!options.isTest)
        {
            if (is_success)
                options.onAccepted();	 
            else
                options.onRejected();	                      
        }
            
	    return is_success;
	};  	
	instanceProto.lxyz_reset = function (new_items)
	{
        // reset items ( uid2xyz )
        window.RexC2BoardLXYZCache.freeLinesInDict(this.items);
        this.items = new_items;
        
        // reset board ( xyz2uid )
        this.board = {};	        
        var uid, xyz;
        for (uid in new_items)
        {
            xyz = new_items[uid];
            this.add_to_board(xyz.x, xyz.y, xyz.z, parseInt(uid));
        }
	};		
	
	instanceProto.chess_position_reset = function ()
	{
	    var layout = this.GetLayout();
	    var pox_save = layout.GetPOX();
		var poy_save = layout.GetPOY();
		layout.SetPOX(this.x);
		layout.SetPOY(this.y);
        var _uid, xyz, chess_inst;
        for (_uid in this.items)
        {
            var uid = parseInt(_uid);
            chess_inst = this.uid2inst(uid);
            if (chess_inst == null)
                continue;                
            xyz = this.uid2xyz(uid);         
            chess_inst.x = layout.LXYZ2PX(xyz.x, xyz.y, xyz.z);
            chess_inst.y = layout.LXYZ2PY(xyz.x, xyz.y, xyz.z);
            chess_inst.set_bbox_changed();
            this.add_uid2pdxy(chess_inst);
        }
		layout.SetPOX(pox_save);
		layout.SetPOY(poy_save);	    
	};	
	    
	instanceProto.do_logical_transfer = function (options)
	{ 
        var layout = this.GetLayout(); 
        var mainboard = this.mainboard_last;
        
	    var uid, new_xyz, new_items = {};
        var lx, ly, lz;
	    // rotate items to new_items  
	    for (uid in this.items)
	    {	        
	        new_xyz = options.onTransferCell(this.items[uid], options);

	        if (options.checkMode != null)
	        {
	            lx = layout.OffsetLX(new_xyz.x, new_xyz.y, 0, mainboard.LOX, mainboard.LOY, 0); 
	            ly = layout.OffsetLY(new_xyz.x, new_xyz.y, 0, mainboard.LOX, mainboard.LOY, 0); 
	            lz = new_xyz.z;

	            if (!this.CellCanPut(mainboard.inst, uid, lx, ly, lz, options.checkMode))
                {
                    window.RexC2BoardLXYZCache.freeLinesInDict(new_items);
	                return null;
                }
	        }
	        new_items[uid] = new_xyz;
	    }
	    return new_items;
	};
	// transfer miniboard		
	
	instanceProto.pickuids = function (uids, chess_type, ignored_chess_check)
	{
	    var check_callback;
	    if (!ignored_chess_check)
	    {
	        var self = this;
	        check_callback = function (uid)
	        {
	            return (self.uid2xyz(uid) != null);
	        }
	    }	       
	    return window.RexC2PickUIDs.call(this, uids, chess_type, check_callback);  
	};
    
    var name2type = {};  // private global object
	instanceProto._pick_all_insts = function ()
	{	      
	    var uid, inst, objtype, sol;
	    hash_clean(name2type);
	    var has_inst = false;    
	    for (uid in this.items)
	    {
		    inst = this.uid2inst(uid);
		    if (inst == null)
		        continue;
	        objtype = inst.type; 
	        sol = objtype.getCurrentSol();
            if (!name2type.hasOwnProperty(objtype.name))
	        {
	            sol.select_all = false;
	            sol.instances.length = 0;
	            name2type[objtype.name] = true;
	        }
	        sol.instances.push(inst);  
	        has_inst = true;
	    }
        hash_clean(name2type);
	    return has_inst;
	};
	
	instanceProto.pick_chess = function (chess_type)
	{
        _uids.length = 0;
        var u;
        for (u in this.items)
        {
            _uids.push(parseInt(u));
        }       
        var has_inst = this.pickuids(_uids, chess_type);
        _uids.length = 0;
        return has_inst;  
	};		
	
	instanceProto.get_minX = function ()
	{
		var uid, xyz;
		var minX;			
		for (uid in this.items)
		{
		    xyz = this.items[uid];
		    if ((minX == null) || (minX > xyz.x))
		        minX = xyz.x;				                
		};        	
        return minX;
	};
	instanceProto.get_minY = function ()
	{
		var uid, xyz;
		var minY;			
		for (uid in this.items)
		{
		    xyz = this.items[uid];
		    if ((minY == null) || (minY > xyz.y))
		        minY = xyz.y;				                
		};        	
        return minY;
	};    
	instanceProto.get_maxX = function ()
	{
		var uid, xyz;
		var maxX;			
		for (uid in this.items)
		{
		    xyz = this.items[uid];
		    if ((maxX == null) || (maxX < xyz.x))
		        maxX = xyz.x;				                
		};        	
        return maxX;
	};
	instanceProto.get_maxY = function ()
	{
		var uid, xyz;
		var maxY;			
		for (uid in this.items)
		{
		    xyz = this.items[uid];
		    if ((maxY == null) || (maxY < xyz.y))
		        maxY = xyz.y;				                
		};        	
        return maxY;
	};
    
	var hash_clean = function (obj)
	{
	    for (var k in obj)
	        delete obj[k];
	};
	
	var is_hash_empty = function (obj)
	{
	    for (var k in obj)
	    {
	        return false;
	    }
	    return true;
	};	
	
	instanceProto.saveToJSON = function ()
	{    
	    // wrap: copy from this.items
	    var uid, uid2xyz_save = {}, item;
	    for (uid in this.items)
	    {
	        uid2xyz_save[uid] = {};
	        item = this.items[uid];
	        uid2xyz_save[uid]["x"] = item.x;
	        uid2xyz_save[uid]["y"] = item.y;
	        uid2xyz_save[uid]["z"] = item.z;	        
	    }
	    // wrap: copy from this.uid2pdxy
	    var uid2pdxy_save = {};
	    for (uid in this.uid2pdxy)
	    {
	        uid2pdxy_save[uid] = {};
	        uid2pdxy_save[uid]["x"] = this.uid2pdxy[uid].x;
	        uid2pdxy_save[uid]["y"] = this.uid2pdxy[uid].y;	        
	    }
	    	    
		return { "pre_x": this.pre_POX,
		         "pre_y": this.pre_POY,
                 "xyz2uid": this.board,
                 "uid2xyz": uid2xyz_save,  
                 "uid2pdxy": uid2pdxy_save,            
                 "luid": (this.type.layout != null)? this.type.layout.uid:(-1),
                 "mb": this.mainboard.saveToJSON(),
                 "mbl": this.mainboard_last.saveToJSON(),
                 "pq": this.is_putting_request_accepted,
               };
	};	
		
	instanceProto.loadFromJSON = function (o)
	{
	    this.pre_POX = o["pre_x"];
		this.pre_POY = o["pre_y"];
        this.board = o["xyz2uid"];
        this.type.layoutUid = o["luid"];
        this.mainboard.loadFromJSON(o["mb"]);
        this.mainboard_last.loadFromJSON(o["mbl"]);
        
        // copy from this.items
        window.RexC2BoardLXYZCache.freeLinesInDict(this.items);
	    var uid, uid2xyz = o["uid2xyz"], item;
	    for (uid in uid2xyz)
	    {
	        item = uid2xyz[uid];
            this.items[uid] = window.RexC2BoardLXYZCache.allocLine(item["x"], item["y"], item["z"]);	        
	    }         
	       
	    // copy from this.uid2pdxy
	    hash_clean(this.uid2pdxy);
	    var uid2pdxy_save = o["uid2pdxy"];
	    for (uid in uid2pdxy_save)
	    {
	        this.uid2pdxy[uid] = {};
	        this.uid2pdxy[uid].x = uid2pdxy_save[uid]["x"];
	        this.uid2pdxy[uid].y = uid2pdxy_save[uid]["y"];       
	    }	          
        
        this.is_putting_request_accepted = o["pq"];
	};
	
	instanceProto.afterLoad = function ()
	{
		if (this.type.layoutUid === -1)
			this.type.layout = null;
		else
		{
			this.type.layout = this.runtime.getObjectByUID(this.type.layoutUid);
			assert2(this.type.layout, "Mini board: Failed to find layout object by UID");
		}		
		this.type.layoutUid = -1;
		
	    this.mainboard.afterLoad();
        this.mainboard_last.afterLoad();
	};
			
	//////////////////////////////////////
	// Conditions
	function Cnds() {};
	pluginProto.cnds = new Cnds();
	  
	Cnds.prototype.CanPut = function (board_objs, offset_lx, offset_ly, test_mode)
	{
		if (!board_objs)
			return;
			
        return this.CanPut(board_objs.getFirstPicked(), offset_lx, offset_ly, test_mode);
	}; 

	Cnds.prototype.PickAllChess = function ()
	{
	    return this._pick_all_insts();
	};
    
	Cnds.prototype.PickMiniboard = function (objtype)
	{
		if (!objtype)
			return; 
        
        if (GINSTGROUP == null)
            GINSTGROUP = new window.RexC2GroupKlass();
            
    	var insts = objtype.getCurrentSol().getObjects();        
    	var i, cnt=insts.length;
        for (i=0; i<cnt; i++)
        {
            var miniboard_uid = get_extra_info(insts[i])["minb_uid"];
            if (miniboard_uid == null)
                continue;
            GINSTGROUP.AddUID(miniboard_uid);
        }
        var miniboard_type = this.runtime.getCurrentCondition().type;  
        var has_picked = window.RexC2PickUIDs.call(this, GINSTGROUP.GetList(), miniboard_type);         
        GINSTGROUP.Clean();
        if (has_picked)
        {
            var current_frame = this.runtime.getCurrentEventStack();
            var current_event = current_frame.current_event;
            var solModifierAfterCnds = current_frame.isModifierAfterCnds();
            
            if (solModifierAfterCnds)
            {
                this.runtime.pushCopySol(current_event.solModifiers);
            }
                
            current_event.retrigger();
            
            if (solModifierAfterCnds)
            {
                this.runtime.popSol(current_event.solModifiers);
            }
        }
		return false;            
	}; 
	  
	Cnds.prototype.IsOnTheBoard = function (board_objs)
	{
		if (!board_objs)
			return false; 
		var board_inst = board_objs.getFirstPicked();
		return (this.mainboard.inst === board_inst);
	}; 
	
	//cf_deprecated
	Cnds.prototype.ArePutAble = function (board_objs, offset_lx, offset_ly) { }; 
	  
	Cnds.prototype.OnPutAbleRequest = function ()
	{
		return true;
	}; 
	
	Cnds.prototype.OnChessKicked = function (chess_type)
	{
        _uids.length = 0;
        _uids.push(this._kicked_chess_uid);
        var has_inst = this.pickuids(_uids, chess_type);
        _uids.length = 0;
        return has_inst;  
	};	
	
	Cnds.prototype.PickChess = function (obj_type)
	{
        return this.pick_chess(obj_type);
	};		
	
	//cf_deprecated
	Cnds.prototype.CanFindEmpty = function (board_objs, _start_lx, _start_ly, _range) { }; 
	
	Cnds.prototype.IsPuttingRequestAccepted = function ()
	{
		return this.is_putting_request_accepted;
	};     
    
    Cnds.prototype.OnPuttingRequestAccepted = function ()
	{
		return true;
	};	
    Cnds.prototype.OnPuttingRequestRejected = function ()
	{
		return true;
	};       
	//////////////////////////////////////
	// Actions
	function Acts() {};
	pluginProto.acts = new Acts();
    
    Acts.prototype.SetupLayout = function (layout_objs)
	{
        var layout = layout_objs.instances[0];
        if (layout.check_name == "LAYOUT")
            this.type.layout = layout;        
        else
            alert ("Mini board should connect to a layout object");
	};  
	
	Acts.prototype.CreateChess = function (obj_type, lx, ly, lz, layer)
	{
	    this.CreateChess(obj_type, lx, ly, lz, layer);        
	};	
	
	Acts.prototype.PutChess = function (board_objs, offset_lx, offset_ly, is_pos_set, test_mode)
	{	 
		if (!board_objs)
			return;
			
		this.PutChess(board_objs.getFirstPicked(),    // board_inst
		              offset_lx,                      // offset_lx
		              offset_ly,                      // offset_ly
		              test_mode,                     // test_mode
		              is_pos_set,                     // is_pos_set
		              false                           // is_put_test
		                                              // ignore_put_request
		              );              
	};
	
	Acts.prototype.PullOutChess = function ()
	{	 
		this.PullOutChess();
	};
	
	Acts.prototype.PickAllChess = function ()
	{	
        this._pick_all_insts();
	};
	
	Acts.prototype.ReleaseAllChess = function ()
	{	
        this.ResetBoard();
	};	
	
	Acts.prototype.SetPutAble = function (put_able)
	{	
        this.is_putable = (put_able === 1);
	};		
	
	Acts.prototype.AddChess = function (obj_type, lx, ly, lz)
	{
        if (!obj_type)
            return;			
	    var inst = obj_type.getFirstPicked();    
        this.AddChess(inst, lx, ly, lz);
	};	
	
	Acts.prototype.PickChess = function (obj_type)
	{	
        this.pick_chess(obj_type);
	};
		
	
	Acts.prototype.PutBack = function (is_pos_set)
	{
	    this.PutChess(this.mainboard_last.inst,     // board_inst
	                  this.mainboard_last.LOX,      // offset_lx
	                  this.mainboard_last.LOY,      // offset_ly
	                  null,                         // test_mode
	                  is_pos_set,                   // is_pos_set
	                  false                         // is_put_test
	                                                // ignore_put_request
	                  );                 
	};		
	
	Acts.prototype.ShiftLOXY = function (pos_type)
	{	
	    if (is_hash_empty(this.items))
	        return;
			        
		var minX= this.get_minX();
        var minY= this.get_minY();
		var maxX= this.get_maxX();
        var maxY= this.get_maxY();
        var new_LOX, new_LOY;
        switch (pos_type)
        {
        case 0:
		    new_LOX = Math.floor((maxX + minX)/2);
		    new_LOY = Math.floor((maxY + minY)/2);	    
        break;
        case 1:
		    new_LOX = minX;
		    new_LOY = minY;	    
        break;        
        }
        
	    if ((new_LOX === 0) && (new_LOY === 0))
	    {        
	        return;
	    }
	    
        var layout = this.GetLayout();	    
	    var pox_save = layout.GetPOX();
		var poy_save = layout.GetPOY();
		layout.SetPOX(this.x);
		layout.SetPOY(this.y);	
        this.x = layout.LXYZ2PX(new_LOX, new_LOY);
        this.y = layout.LXYZ2PY(new_LOX, new_LOY);	        

        var pre_items = this.items;
		this.ResetBoard(true);  // ignore recycle this.item        
        var uid, xyz;
        var chess_inst, new_lx, new_ly;
		for (uid in pre_items)
		{
		    xyz = pre_items[uid];
		    new_lx = layout.OffsetLX(xyz.x, xyz.y, 0, -new_LOX, -new_LOY, 0);
		    new_ly = layout.OffsetLY(xyz.x, xyz.y, 0, -new_LOX, -new_LOY, 0);
            
            if (!isNaN(uid))
                uid = parseInt(uid);
            
		    this.AddChess(uid, new_lx, new_ly, xyz.z);
		};
        window.RexC2BoardLXYZCache.freeLinesInDict(pre_items);  // recycle

		layout.SetPOX(pox_save);
		layout.SetPOY(poy_save);		
	};	
	
	Acts.prototype.RemoveChess = function (obj_type)
	{
        if (!obj_type)
            return;  
        var chess = obj_type.getCurrentSol().getObjects();
        var i, chess_cnt=chess.length;
        for (i=0; i<chess_cnt; i++)  
        {      
	        this.RemoveChess(chess[i].uid);
	    }
	};	
    
	//////////////////////////////////////
	// Expressions
	function Exps() {};
	pluginProto.exps = new Exps();
	
	Exps.prototype.LX = function (ret)
	{
	    ret.set_int(this.mainboard.LOX);
	};
	Exps.prototype.LY = function (ret)
    {
	    ret.set_int(this.mainboard.LOY);
	};	
	Exps.prototype.LastLX = function (ret)
	{
	    ret.set_int(this.mainboard_last.LOX);
	};
	Exps.prototype.LastLY = function (ret)
    {
	    ret.set_int(this.mainboard_last.LOY);
	};	
	Exps.prototype.RequestLX = function (ret)
	{
	    ret.set_int(this.exp_RequestLX);
	};
	Exps.prototype.RequestLY = function (ret)
	{
	    ret.set_int(this.exp_RequestLY);
	}; 
	Exps.prototype.RequestLZ = function (ret)
	{
	    ret.set_int(this.exp_RequestLZ);
	};
	Exps.prototype.RequestChessUID = function (ret)
	{
	    ret.set_any(this.exp_RequestChessUID);
	};	
	Exps.prototype.RequestMainBoardUID = function (ret)
	{
	    ret.set_int(this.exp_RequestMainBoardUID);
	};	
	//ef_deprecated
	Exps.prototype.EmptyLX = function (ret) { ret.set_int(0); };
	// ef_deprecated
	Exps.prototype.EmptyLY = function (ret) { ret.set_int(0); };   
	
	Exps.prototype.UID2LX = function (ret, uid)
	{
	    var xyz = this.uid2xyz(uid);
	    var lx = (xyz == null)? (-1): xyz.x;   
	    ret.set_int(lx);
	};
	Exps.prototype.UID2LY = function (ret, uid)
	{
	    var xyz = this.uid2xyz(uid);
	    var ly = (xyz == null)? (-1): xyz.y;   
	    ret.set_int(ly);
	};	
	Exps.prototype.UID2LZ = function (ret, uid)
	{
	    var xyz = this.uid2xyz(uid);
	    var lz = (xyz == null)? (-1): xyz.z;   
	    ret.set_int(lz);
	};
	
	Exps.prototype.UID2PX = function (ret, uid)
	{
	    var xyz = this.uid2xyz(uid);
	    var px;
	    if (xyz == null)
	        px = -1;
	    else
	    {
	        var layout = this.GetLayout();
	        var pox_save = layout.GetPOX();
		    var poy_save = layout.GetPOY();
		    layout.SetPOX(this.x);
		    layout.SetPOY(this.y);			        
	        px = this.GetLayout().LXYZ2PX(xyz.x, xyz.y, xyz.z);   
		    layout.SetPOX(pox_save);
		    layout.SetPOY(poy_save);	        
	    }
	    ret.set_float(px);
	};
	Exps.prototype.UID2PY = function (ret, uid)
	{
	    var xyz = this.uid2xyz(uid);
	    var py;
	    if (xyz == null)
	        py = -1;
	    else
	    {
	        var layout = this.GetLayout();
	        var pox_save = layout.GetPOX();
		    var poy_save = layout.GetPOY();
		    layout.SetPOX(this.x);
		    layout.SetPOY(this.y);			        
	        py = this.GetLayout().LXYZ2PY(xyz.x, xyz.y, xyz.z);   
		    layout.SetPOX(pox_save);
		    layout.SetPOY(poy_save);	        
	    }   
	    ret.set_float(py);
	};		 


// --------    
	var MainboardRefKlass = function (runtime)
	{
        this.runtime = runtime;
	    this.Reset();   
	}
	var MainboardRefKlassProto = MainboardRefKlass.prototype;
    
	MainboardRefKlassProto.Reset = function()
	{	    
	    this.inst = null;
	    this.LOX = (-1);
	    this.LOY = (-1);
	    this.saveUID = (-1);	// for loading	   
	};    
	MainboardRefKlassProto.SetBoard = function(inst, lx, ly)
	{	    
	    this.inst = inst;
	    this.LOX = (inst==null)? (-1):lx;
	    this.LOY = (inst==null)? (-1):ly;
	};
	MainboardRefKlassProto.saveToJSON = function()
	{	    
	    return {"uid": (this.inst==null)? (-1):this.inst.uid,
	            "LOX": this.LOX,
	            "LOY": this.LOY};
	};
	MainboardRefKlassProto.loadFromJSON = function(o)
	{
	    this.LOX = o["LOX"];
	    this.LOY = o["LOY"];
	    this.saveUID = o["uid"];
	}; 
	MainboardRefKlassProto.afterLoad = function ()
	{ 
		if (this.saveUID === -1)
			this.inst = null;
		else
		{
			this.inst = this.runtime.getObjectByUID(this.saveUID);
			assert2(this.inst, "Mini board: Failed to find main board object by UID");
		}		
		this.saveUID = -1;
	};       
    
    // export
    cr.plugins_.Rex_MiniBoard.MainboardRefKlass = MainboardRefKlass;
}());


(function ()
{
    // general CreateObject function which call a callback before "OnCreated" triggered
    if (window.RexC2CreateObject != null)
        return;
        
    // copy from system action: CreateObject
    var CreateObject = function (obj, layer, x, y, callback, ignore_picking)
    {
        if (!layer || !obj)
            return;

        var inst = this.runtime.createInstance(obj, layer, x, y);
		
		if (!inst)
			return;
		
		this.runtime.isInOnDestroy++;
		
		// call callback before "OnCreated" triggered
		if (callback)
		    callback(inst);
		// call callback before "OnCreated" triggered
		
		var i, len, s;
		this.runtime.trigger(Object.getPrototypeOf(obj.plugin).cnds.OnCreated, inst);
		
		if (inst.is_contained)
		{
			for (i = 0, len = inst.siblings.length; i < len; i++)
			{
				s = inst.siblings[i];
				this.runtime.trigger(Object.getPrototypeOf(s.type.plugin).cnds.OnCreated, s);
			}
		}
		
		this.runtime.isInOnDestroy--;

        if (ignore_picking !== true)
        {
            // Pick just this instance
            var sol = obj.getCurrentSol();
            sol.select_all = false;
		    sol.instances.length = 1;
		    sol.instances[0] = inst;
		
		    // Siblings aren't in instance lists yet, pick them manually
		    if (inst.is_contained)
		    {
			    for (i = 0, len = inst.siblings.length; i < len; i++)
			    {
				    s = inst.siblings[i];
				    sol = s.type.getCurrentSol();
				    sol.select_all = false;
				    sol.instances.length = 1;
				    sol.instances[0] = s;
			    }
		    }
        }

        // add solModifiers
        //var current_event = this.runtime.getCurrentEventStack().current_event;
        //current_event.addSolModifier(obj);
        // add solModifiers
        
		return inst;
    };
    
    window.RexC2CreateObject = CreateObject;
}());

(function ()
{
    // general pick instances function
    if (window.RexC2PickUIDs != null)
        return;

	var PickUIDs = function (uids, objtype, check_callback)
	{
        var sol = objtype.getCurrentSol();
        sol.instances.length = 0;
        sol.select_all = false;
        var is_family = objtype.is_family;
        var members,member_cnt,i;
        if (is_family)
        {
            members = objtype.members;
            member_cnt = members.length;
        }
        var i,j,uid_cnt=uids.length;
        for (i=0; i<uid_cnt; i++)
        {
            var uid = uids[i];
            var inst = this.runtime.getObjectByUID(uid);
            if (inst == null)
                continue;
            if ((check_callback != null) && (!check_callback(uid)))
                continue;
            
            var type_name = inst.type.name;
            if (is_family)
            {
                for (j=0; j<member_cnt; j++)
                {
                    if (type_name == members[j].name)
                    {
                        sol.instances.push(inst); 
                        break;
                    }
                }
            }
            else
            {
                if (type_name == objtype.name)
                {
                    sol.instances.push(inst);
                }
            }            
        }
        objtype.applySolToContainer();
	    return (sol.instances.length > 0);	    
	};    

    window.RexC2PickUIDs = PickUIDs;
}());    


(function ()
{   
    // general group class
    if (window.RexC2GroupKlass != null)
        return;
        
    var GroupKlass = function()
    {
		this._set = {};
        this._list = [];    
    };
    var GroupKlassProto = GroupKlass.prototype;
    
	GroupKlassProto.Clean = function()
	{
        var key;
        for (key in this._set)
            delete this._set[key];
        this._list.length = 0;
	};
    
	GroupKlassProto.Copy = function(group)
	{
        var key, hash_obj;
        hash_obj = this._set;
        for (key in hash_obj)
            delete this._set[key];
        hash_obj = group._set;
        for (key in hash_obj)
            this._set[key] = hash_obj[key];
		cr.shallowAssignArray(this._list, group._list);
	};   
	
	GroupKlassProto.SetByUIDList = function(uid_list, can_repeat)
	{
	    if (can_repeat)    // special case
	    {
	        cr.shallowAssignArray(this._list, uid_list);
	        var list_len = uid_list.length;
	        var i, key, hash_obj;
            hash_obj = this._set;
            for (key in hash_obj)
                delete this._set[key];
	        for (i=0; i<list_len; i++)
	            this._set[uid_list[i]] = true;	        
	    }
	    else
	    {
	        this.Clean();
	        this.AddUID(uid_list);
	    }
	};
	
	GroupKlassProto.AddUID = function(_uid)  // single number, number list
	{
        if (typeof(_uid) === "object")
        {
	        var i, uid, cnt=_uid.length;
	        for (i=0; i<cnt; i++)
	        {
	            uid = _uid[i];
	            if (this._set[uid] == null)    // not in group
	            {
	                this._set[uid] = true;
	                this._list.push(uid);      // push back
	            }
                // else ingored 
	        }        
        }
        
	    else    // single number or symbol
	    {
	        if (this._set[_uid] == null)    // not in group
	        {
	            this._set[_uid] = true;
	            this._list.push(_uid);      // push back
	        }
            // else ingored 
	    }
	};
    
   	GroupKlassProto.PushUID = function(_uid, is_front)  // single number, number list
	{	    
	    if (typeof(_uid) === "object")
	    {
	        var i, uid, cnt=_uid.length;
	        for (i=0; i<cnt; i++)
	        {
	            uid = _uid[i];
	            if (this._set[uid] == null)
	                this._set[uid] = true;
	            else    // remove existed item in this._list
	                cr.arrayRemove(this._list, this._list.indexOf(uid));
	        }
	        
	        // add uid ( no repeating check )
	        if (is_front)	            
	            this._list.unshift.apply(this._list, _uid); // push front
	        else
	            this._list.push.apply(this._list, _uid);    // push back	  
	        
	    }
	    
	    else    // single number or symbol
	    {
	        if (this._set[_uid] == null)
	            this._set[_uid] = true;
	        else    // remove existed item in this._list
	            cr.arrayRemove(this._list, this._list.indexOf(_uid));
	            
	        
	        // add uid
	        if (is_front)	            
	            this._list.unshift(_uid);      // push front
	        else
	            this._list.push(_uid);         // push back	        
	    }

	};
	
   	GroupKlassProto.InsertUID = function(_uid, index)  // single number, number list
	{	   
	    if (typeof(_uid) === "object")
	    {
	        var i, uid, cnt=_uid.length;
	        for (i=0; i<cnt; i++)
	        {
	            uid = _uid[i];
	            if (this._set[uid] == null)
	                this._set[uid] = true;
	            else    // remove existed item in this._list
	                cr.arrayRemove(this._list, this._list.indexOf(uid));
	        }
	        
	        // add uid ( no repeating check )
	        arrayInsert(this._list, _uid, index)     
	        
	    }
        
	    else    // single number or symbol
	    {
	        if (this._set[_uid] == null)
	            this._set[_uid] = true;
	        else    // remove existed item in this._list
	            cr.arrayRemove(this._list, this._list.indexOf(_uid));
	            
	        arrayInsert(this._list, _uid, index)      
	    }

	};
		
	GroupKlassProto.RemoveUID = function(_uid)  // single number, number list
	{
	    if (typeof(_uid) === "object")
	    {
	        var i, uid, cnt=_uid.length;
	        for (i=0; i<cnt; i++)
	        {
	            uid = _uid[i];
	            if (this._set[uid] != null)
	            {
	                delete this._set[uid];
	                cr.arrayRemove(this._list, this._list.indexOf(uid));    
	            }
                // else ingored 
	        }
	    }
        
	    else    // single number or symbol
	    {
	        if (this._set[_uid] != null)
	        {
	            delete this._set[_uid];
	            cr.arrayRemove(this._list, this._list.indexOf(_uid));     
	        }
	    }

	};
	
	GroupKlassProto.UID2Index = function(uid)
	{
	    return this._list.indexOf(uid);    
	};
	
	GroupKlassProto.Index2UID = function(index)
	{
        var _list = this._list;
        var uid = _list[index] || (-1);
        return uid;
	};		
		
	GroupKlassProto.Union = function(group)
	{
	    var uids = group._set;
        var uid;        
        for (uid in uids)        
            this.AddUID(parseInt(uid));    
	};	
		
	GroupKlassProto.Complement = function(group)
	{	  
	    this.RemoveUID(group._list);            
	};
		
	GroupKlassProto.Intersection = function(group)
	{	    
	    // copy this._set
	    var uid, hash_uid=this._set;	    
	    var set_copy={};
	    for (uid in hash_uid)
	        set_copy[uid] = true;
	        
	    // clean all
	    this.Clean();
	    
	    // add intersection itme
	    hash_uid = group._set;
	    for (uid in hash_uid)
	    {
	        if (set_copy[uid] != null)
	            this.AddUID(parseInt(uid));
	    }
	};	
    
	GroupKlassProto.IsSubset = function(subset_group)
	{
        var subset_uids = subset_group._set;
        var uid;     
        var is_subset = true;        
        for (uid in subset_uids)        
        {
            if (!(uid in this._set))
            {
                is_subset = false;
                break;
            }
        }
        return is_subset;
	};    
	
	GroupKlassProto.GetSet = function()
	{
	    return this._set;
	};
	
	GroupKlassProto.GetList = function()
	{
	    return this._list;
	};
	
	GroupKlassProto.IsInGroup = function(uid)
	{
	    return (this._set[uid] != null);
	};
		
	GroupKlassProto.ToString = function()
	{
	    return JSON.stringify(this._list);
	};
	
	GroupKlassProto.JSONString2Group = function(JSON_string)
	{
	    this.SetByUIDList(JSON.parse(JSON_string));
	};	
	
	GroupKlassProto.Shuffle = function(random_gen)
	{
	    _shuffle(this._list, random_gen);
	};
	
	var _shuffle = function (arr, random_gen)
	{
        var i = arr.length, j, temp, random_value;
        if ( i == 0 ) return;
        while ( --i ) 
        {
		    random_value = (random_gen == null)?
			               Math.random(): random_gen.random();
            j = Math.floor( random_value * (i+1) );
            temp = arr[i]; 
            arr[i] = arr[j]; 
            arr[j] = temp;
        }
    };	
    
    var arrayInsert = function (arr, _value, index)
    {       
        var arr_len=arr.length;
        if (index > arr_len)
            index = arr_len;
        if (typeof(_value) != "object")
        {
            if (index == 0)
                arr.unshift(_value);
            else if (index == arr_len)
                arr.push(_value);
            else
            {
                var i, last_index=arr.length;
                arr.length += 1;
                for (i=last_index; i>index; i--)
                    arr[i] = arr[i-1];
                arr[index] = _value;
            }
        }
        else
        {
            if (index == 0)
                arr.unshift.apply(arr, _value);
            else if (index == arr_len)
                arr.push.apply(arr, _value);
            else
            {
                var start_index=arr.length-1;
                var end_index=index;
                var cnt=_value.length;   
                arr.length += cnt;
                var i;
                for (i=start_index; i>=end_index; i--)
                    arr[i+cnt] = arr[i];
                for (i=0; i<cnt; i++)
                    arr[i+index] = _value[i];
            }
        }
    };
    
    window.RexC2GroupKlass = GroupKlass;    
}());    
