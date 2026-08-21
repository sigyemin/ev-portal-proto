//----------------------------------------------------- interface functions for app -----------------------------------------------------

/*
g_rn_app : access properties

properties
    app_ver
    is_android
    is_ios
    is_web

event
    onCustomer_listener
*/

// func.
// inner listener of g_rn_app
function g_rn_app_listenerFromApp(event){
    // set necessary values from app
    //cmdParams[0], cmdParams[1]
    const {cmdType, cmdParams}	= JSON.parse(event.data);
    
    if (cmdType == "APP_INFO"){
        g_rn_app.app_ver        = cmdParams[0];
        
        if (g_rn_app.started_main_functon == false && typeof g_rn_app.main_function == 'function'){
            g_rn_app.started_main_functon    = true;
            setTimeout(g_rn_app.main_function, 1);
        }
        return;
    }

    if (typeof g_rn_app.onCustomer_listener == 'function'){
        g_rn_app.onCustomer_listener(event);
    }
}

// object.
// define app object.
// first call init() function..
const g_rn_app = {
    app_viewer          : null,
    app_ver             : "0.0.0",
    can_use_app         : false,
    is_android          : false,
    is_ios              : false,
    is_web              : false,
    started_main_functon    : false,
    main_function       : null,
    onCustomer_listener : null,

    // send a message from web to app
    sendMessageToApp  : function(type, params){
        if (this.app_viewer == null){
            return;
        }
        this.app_viewer.postMessage(JSON.stringify({cmdType:type, cmdParams:params}));
    },

    // initialize parameters and functions for using app
    init  : function(){
        const userAgent = navigator.userAgent.toLowerCase();
        this.is_android = userAgent.indexOf("android") >= 0 ? true : false;
        this.is_ios     = userAgent.indexOf("ios") >= 0 ? true : false;

        if (this.is_android == false && this.is_ios == false){
            this.is_web = true;
            return;
        }
        if (typeof window.ReactNativeWebView != 'object'){
            //alert("설치된 앱이 없습니다. 앱을 설치 후 사용하세요.");
            return;
        }

        var receiver    = this.is_android ? document : window;
        receiver.addEventListener("message", g_rn_app_listenerFromApp);
        this.app_viewer     = window.ReactNativeWebView;
        this.can_use_app    = true;
        
        this.sendMessageToApp("THIS_URL", new Array(window.location.href));
    },

    // check if the main function didn't run, run main function.
    run_main_function : function(mainFunction){
        // only for react native
        if (this.can_use_app == false){
            this.started_main_functon   = true;
            this.main_function  = mainFunction;
            setTimeout(this.main_function, 1);
            return;
        }
        // aleady run main function
        if (this.started_main_functon == true){
            return;
        }
        // still coming a response from app..
        // will execute by g_rn_app_listenerFromApp
        if (this.app_ver == "0.0.0"){
            this.main_function  = mainFunction;
            return;
        }

        // aleady run g_rn_app_listenerFromApp but didn't execute main function
        this.started_main_functon   = true;
        this.main_function  = mainFunction;
        setTimeout(this.main_function, 1);
    },
};

$(function(){
    g_rn_app.init();
});

//----------------------------------------------------- interface functions for app -----------------------------------------------------