"use strict";var W=Object.create;var y=Object.defineProperty;var z=Object.getOwnPropertyDescriptor;var _=Object.getOwnPropertyNames;var $=Object.getPrototypeOf,L=Object.prototype.hasOwnProperty;var B=(n,e)=>{for(var o in e)y(n,o,{get:e[o],enumerable:!0})},j=(n,e,o,i)=>{if(e&&typeof e=="object"||typeof e=="function")for(let t of _(e))!L.call(n,t)&&t!==o&&y(n,t,{get:()=>e[t],enumerable:!(i=z(e,t))||i.enumerable});return n};var P=(n,e,o)=>(o=n!=null?W($(n)):{},j(e||!n||!n.__esModule?y(o,"default",{value:n,enumerable:!0}):o,n)),T=n=>j(y({},"__esModule",{value:!0}),n);var U={};B(U,{activate:()=>O,deactivate:()=>H});module.exports=T(U);var a=P(require("vscode")),r=P(require("fs")),s=P(require("path")),w=P(require("os")),D=s.join(w.homedir(),"Library","Application Support","Windsurf"),h=s.join(D,"User","globalStorage"),v=s.join(w.homedir(),".windsurf-switcher-free"),S=s.join(v,"profiles.json"),A=s.join(h,"state.vscdb");function m(n){r.existsSync(n)||r.mkdirSync(n,{recursive:!0})}function N(){try{if(!r.existsSync(A))return null;let e=r.readFileSync(A).toString("utf-8"),o=e.match(/windsurfAuthStatus[\x00-\x1f]*([{].*?"email".*?[}])/s);if(o){let l=o[1];try{let d=JSON.parse(l);return{name:d.name||"\u672A\u77E5",email:d.email||"\u672A\u77E5"}}catch{let d=l.match(/"name"\s*:\s*"([^"]+)"/),f=l.match(/"email"\s*:\s*"([^"]+)"/);if(f)return{name:d?d[1]:"\u672A\u77E5",email:f[1]}}}let i=/"email"\s*:\s*"([^"@]+@[^"]+)"/g,t=e.match(i);if(t&&t.length>0){let l=t[0].match(/"email"\s*:\s*"([^"]+)"/);if(l)return{name:l[1].split("@")[0],email:l[1]}}return null}catch(n){return console.error("\u8BFB\u53D6\u8D26\u6237\u4FE1\u606F\u5931\u8D25:",n),null}}function E(){return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,n=>{let e=Math.random()*16|0;return(n==="x"?e:e&3|8).toString(16)})}function k(){return new Date().toLocaleString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit"})}function g(n,e,o=[]){m(e);let i=r.readdirSync(n,{withFileTypes:!0});for(let t of i){if(o.some(c=>c.startsWith("*.")?t.name.endsWith(c.slice(1)):c.endsWith("*")?t.name.startsWith(c.slice(0,-1)):t.name===c))continue;let d=s.join(n,t.name),f=s.join(e,t.name);t.isDirectory()?g(d,f,o):r.copyFileSync(d,f)}}function M(n){r.existsSync(n)&&r.rmSync(n,{recursive:!0,force:!0})}var I=class{constructor(){this.storageData=this.loadStorage()}loadStorage(){if(m(v),r.existsSync(S))try{let e=r.readFileSync(S,"utf-8");return JSON.parse(e)}catch(e){console.error("\u52A0\u8F7D\u914D\u7F6E\u6587\u4EF6\u5931\u8D25:",e)}return{profiles:[],currentProfile:""}}saveStorage(){m(v),r.writeFileSync(S,JSON.stringify(this.storageData,null,2))}getProfiles(){return this.storageData.profiles}getCurrentProfileId(){return this.storageData.currentProfile}saveCurrentProfile(e,o){let i=E(),t=s.join(v,"profiles",i);m(t);let l=s.join(t,"globalStorage");r.existsSync(h)&&g(h,l,["*.backup.*","ms-*"]);let d=["Cookies","Cookies-journal","Local Storage","Session Storage","Network Persistent State"];for(let x of d){let u=s.join(D,x),b=s.join(t,x);r.existsSync(u)&&(r.statSync(u).isDirectory()?g(u,b):r.copyFileSync(u,b))}let f=s.join(w.homedir(),".codeium","windsurf"),c=s.join(t,"codeium");if(r.existsSync(f)){m(c);let x=["installation_id","user_settings.pb"];for(let u of x){let b=s.join(f,u);r.existsSync(b)&&r.copyFileSync(b,s.join(c,u))}}let p={id:i,name:e,email:o,savedAt:k(),profilePath:t},C=s.join(t,"profile_meta.json");return r.writeFileSync(C,JSON.stringify({name:e,email:o,saved_at:k()},null,2)),this.storageData.profiles.push(p),this.storageData.currentProfile=i,this.saveStorage(),p}importProfile(e){let o=s.join(e,"profile_meta.json"),i="\u5BFC\u5165\u7684\u8D26\u6237",t="unknown@example.com";if(r.existsSync(o))try{let c=JSON.parse(r.readFileSync(o,"utf-8"));i=c.name||i,t=c.email||t}catch(c){console.error("\u8BFB\u53D6 profile_meta.json \u5931\u8D25:",c)}let l=E(),d=s.join(v,"profiles",l);g(e,d);let f={id:l,name:i,email:t,savedAt:k(),profilePath:d};return this.storageData.profiles.push(f),this.saveStorage(),f}switchProfile(e){let o=this.storageData.profiles.find(i=>i.id===e);if(!o)return!1;if(!r.existsSync(o.profilePath))return a.window.showErrorMessage(`\u8D26\u6237\u914D\u7F6E\u76EE\u5F55\u4E0D\u5B58\u5728: ${o.profilePath}`),!1;try{let i=s.join(o.profilePath,"globalStorage");r.existsSync(i)&&(r.existsSync(h)&&M(h),g(i,h));let t=["Cookies","Cookies-journal","Local Storage","Session Storage","Network Persistent State"];for(let f of t){let c=s.join(o.profilePath,f),p=s.join(D,f);r.existsSync(c)&&(r.existsSync(p)&&(r.statSync(p).isDirectory()?M(p):r.unlinkSync(p)),r.statSync(c).isDirectory()?g(c,p):r.copyFileSync(c,p))}let l=s.join(o.profilePath,"codeium"),d=s.join(w.homedir(),".codeium","windsurf");if(r.existsSync(l)){m(d);let f=r.readdirSync(l);for(let c of f)r.copyFileSync(s.join(l,c),s.join(d,c))}return this.storageData.currentProfile=e,this.saveStorage(),!0}catch(i){return console.error("\u5207\u6362\u8D26\u6237\u5931\u8D25:",i),a.window.showErrorMessage(`\u5207\u6362\u8D26\u6237\u5931\u8D25: ${i}`),!1}}deleteProfile(e){let o=this.storageData.profiles.findIndex(t=>t.id===e);if(o===-1)return!1;let i=this.storageData.profiles[o];return M(i.profilePath),this.storageData.profiles.splice(o,1),this.storageData.currentProfile===e&&(this.storageData.currentProfile=""),this.saveStorage(),!0}exportProfile(e,o){let i=this.storageData.profiles.find(t=>t.id===e);if(!i)return!1;try{return g(i.profilePath,o),!0}catch(t){return console.error("\u5BFC\u51FA\u8D26\u6237\u5931\u8D25:",t),!1}}},F=class{constructor(e,o){this.extensionUri=e;this.profileManager=o}resolveWebviewView(e,o,i){this._view=e,e.webview.options={enableScripts:!0,localResourceRoots:[this.extensionUri]},e.webview.html=this.getHtmlContent(),e.webview.onDidReceiveMessage(async t=>{switch(t.type){case"getProfiles":this.sendProfiles();break;case"saveProfile":await this.handleSaveProfile(t.name,t.email);break;case"switchProfile":await this.handleSwitchProfile(t.profileId);break;case"deleteProfile":await this.handleDeleteProfile(t.profileId);break;case"importProfile":await this.handleImportProfile();break;case"exportProfile":await this.handleExportProfile(t.profileId);break;case"openProfilesDir":await this.handleOpenProfilesDir();break;case"getCurrentAccount":this.sendCurrentAccount();break}})}sendProfiles(){this._view&&this._view.webview.postMessage({type:"profiles",profiles:this.profileManager.getProfiles(),currentProfile:this.profileManager.getCurrentProfileId()})}sendCurrentAccount(){if(this._view){let e=N();this._view.webview.postMessage({type:"currentAccount",account:e})}}async handleSaveProfile(e,o){try{this.profileManager.saveCurrentProfile(e,o),a.window.showInformationMessage(`\u8D26\u6237 "${e}" \u4FDD\u5B58\u6210\u529F\uFF01`),this.sendProfiles()}catch(i){a.window.showErrorMessage(`\u4FDD\u5B58\u8D26\u6237\u5931\u8D25: ${i}`)}}async handleSwitchProfile(e){let o=this.profileManager.getProfiles().find(t=>t.id===e);if(!o)return;await a.window.showWarningMessage(`\u786E\u5B9A\u8981\u5207\u6362\u5230\u8D26\u6237 "${o.name}" \u5417\uFF1F
\u5207\u6362\u540E\u9700\u8981\u91CD\u542F Windsurf \u624D\u80FD\u751F\u6548\u3002`,"\u786E\u5B9A\u5207\u6362","\u53D6\u6D88")==="\u786E\u5B9A\u5207\u6362"&&this.profileManager.switchProfile(e)&&(await a.window.showWarningMessage(`\u26A0\uFE0F \u91CD\u8981\u63D0\u9192\uFF1A\u5DF2\u5207\u6362\u5230\u8D26\u6237 "${o.name}"\uFF01

\u{1F504} \u5FC5\u987B\u3010\u5B8C\u5168\u91CD\u542F\u3011Windsurf \u624D\u80FD\u751F\u6548\uFF01
\uFF08\u4EC5\u91CD\u8F7D\u7A97\u53E3\u53EF\u80FD\u4E0D\u591F\uFF0C\u5EFA\u8BAE\u5B8C\u5168\u5173\u95ED\u540E\u91CD\u65B0\u6253\u5F00\uFF09`,"\u7ACB\u5373\u91CD\u542F\u7A97\u53E3","\u6211\u77E5\u9053\u4E86\uFF0C\u7A0D\u540E\u624B\u52A8\u91CD\u542F")==="\u7ACB\u5373\u91CD\u542F\u7A97\u53E3"?a.commands.executeCommand("workbench.action.reloadWindow"):a.window.showWarningMessage("\u26A0\uFE0F \u8BF7\u8BB0\u5F97\u624B\u52A8\u91CD\u542F Windsurf\uFF0C\u5426\u5219\u5207\u6362\u4E0D\u4F1A\u751F\u6548\uFF01"),this.sendProfiles())}async handleDeleteProfile(e){let o=this.profileManager.getProfiles().find(t=>t.id===e);if(!o)return;await a.window.showWarningMessage(`\u786E\u5B9A\u8981\u5220\u9664\u8D26\u6237 "${o.name}" \u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002`,"\u786E\u5B9A\u5220\u9664","\u53D6\u6D88")==="\u786E\u5B9A\u5220\u9664"&&this.profileManager.deleteProfile(e)&&(a.window.showInformationMessage(`\u8D26\u6237 "${o.name}" \u5DF2\u5220\u9664\u3002`),this.sendProfiles())}async handleImportProfile(){let e=await a.window.showOpenDialog({canSelectFiles:!1,canSelectFolders:!0,canSelectMany:!1,title:"\u9009\u62E9\u8981\u5BFC\u5165\u7684\u8D26\u6237\u914D\u7F6E\u76EE\u5F55"});if(e&&e.length>0){let o=this.profileManager.importProfile(e[0].fsPath);o?(a.window.showInformationMessage(`\u8D26\u6237 "${o.name}" \u5BFC\u5165\u6210\u529F\uFF01`),this.sendProfiles()):a.window.showErrorMessage("\u5BFC\u5165\u8D26\u6237\u5931\u8D25")}}async handleExportProfile(e){let o=this.profileManager.getProfiles().find(t=>t.id===e);if(!o)return;let i=await a.window.showOpenDialog({canSelectFiles:!1,canSelectFolders:!0,canSelectMany:!1,title:"\u9009\u62E9\u5BFC\u51FA\u76EE\u6807\u76EE\u5F55"});if(i&&i.length>0){let t=s.join(i[0].fsPath,`windsurf-profile-${o.name}`);this.profileManager.exportProfile(e,t)?a.window.showInformationMessage(`\u8D26\u6237\u5DF2\u5BFC\u51FA\u5230: ${t}`):a.window.showErrorMessage("\u5BFC\u51FA\u8D26\u6237\u5931\u8D25")}}async handleOpenProfilesDir(){let e=s.join(v,"profiles");m(e);let o=a.Uri.file(e);await a.commands.executeCommand("revealFileInOS",o),a.window.showInformationMessage(`\u914D\u7F6E\u76EE\u5F55: ${e}`)}refresh(){this.sendProfiles()}getHtmlContent(){return`<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Windsurf \u8D26\u6237\u5207\u6362</title>
    <style>
        /* ================================================================ */
        /* \u57FA\u7840\u6837\u5F0F - \u73B0\u4EE3\u5316\u8BBE\u8BA1                                              */
        /* ================================================================ */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 13px;
            color: var(--vscode-foreground);
            background: linear-gradient(180deg, var(--vscode-sideBar-background) 0%, var(--vscode-editor-background) 100%);
            padding: 16px;
            min-height: 100vh;
        }
        
        /* ================================================================ */
        /* \u5934\u90E8\u533A\u57DF - \u6E10\u53D8\u80CC\u666F                                                */
        /* ================================================================ */
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 16px;
            text-align: center;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        
        .header h2 {
            font-size: 18px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 6px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .header p {
            font-size: 12px;
            color: rgba(255,255,255,0.9);
        }
        
        .header .feature-tags {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-top: 10px;
            flex-wrap: wrap;
        }
        
        .header .tag {
            background: rgba(255,255,255,0.2);
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 10px;
            color: #fff;
            backdrop-filter: blur(10px);
        }
        
        /* ================================================================ */
        /* \u64CD\u4F5C\u6309\u94AE\u533A\u57DF - \u5361\u7247\u5F0F\u5E03\u5C40                                          */
        /* ================================================================ */
        .actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 16px;
        }
        
        .btn {
            padding: 12px 16px;
            font-size: 12px;
            font-weight: 600;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .btn:active {
            transform: scale(0.98);
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
        }
        
        .btn-primary:hover {
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            transform: translateY(-2px);
        }
        
        .btn-secondary {
            background: var(--vscode-editor-background);
            color: var(--vscode-foreground);
            border: 1px solid var(--vscode-panel-border);
        }
        
        .btn-secondary:hover {
            background: var(--vscode-list-hoverBackground);
            border-color: #667eea;
        }
        
        .btn-success {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            color: #ffffff;
        }
        
        .btn-danger {
            background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
            color: #ffffff;
        }
        
        .btn-danger:hover {
            box-shadow: 0 4px 15px rgba(235, 51, 73, 0.4);
        }
        
        .btn-full {
            grid-column: span 2;
        }
        
        /* ================================================================ */
        /* \u8D26\u6237\u5217\u8868 - \u5361\u7247\u8BBE\u8BA1                                                */
        /* ================================================================ */
        .section-title {
            font-size: 12px;
            font-weight: 600;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .profile-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .profile-item {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 12px;
            padding: 14px;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .profile-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
            opacity: 0;
            transition: opacity 0.3s;
        }
        
        .profile-item:hover {
            border-color: #667eea;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
            transform: translateX(4px);
        }
        
        .profile-item:hover::before {
            opacity: 1;
        }
        
        .profile-item.active {
            border-color: #667eea;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
        }
        
        .profile-item.active::before {
            opacity: 1;
        }
        
        .profile-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
        }
        
        .profile-info h3 {
            font-size: 14px;
            font-weight: 600;
            color: var(--vscode-foreground);
            margin-bottom: 4px;
        }
        
        .profile-info .email {
            font-size: 11px;
            color: #667eea;
            font-weight: 500;
        }
        
        .profile-info .time {
            font-size: 10px;
            color: var(--vscode-descriptionForeground);
            margin-top: 4px;
        }
        
        .profile-badge {
            font-size: 10px;
            padding: 4px 10px;
            border-radius: 20px;
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            color: #ffffff;
            font-weight: 600;
        }
        
        .profile-actions {
            display: flex;
            gap: 8px;
            margin-top: 10px;
        }
        
        .profile-actions .btn {
            padding: 8px 14px;
            font-size: 11px;
            flex: 1;
        }
        
        /* ================================================================ */
        /* \u4FDD\u5B58\u8868\u5355 - \u5F39\u51FA\u5F0F\u8BBE\u8BA1                                              */
        /* ================================================================ */
        .save-form {
            background: var(--vscode-editor-background);
            border: 2px solid #667eea;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 16px;
            display: none;
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.2);
        }
        
        .save-form.show {
            display: block;
            animation: slideDown 0.3s ease;
        }
        
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .save-form h3 {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 14px;
            color: #667eea;
        }
        
        .form-group {
            margin-bottom: 12px;
        }
        
        .form-group label {
            display: block;
            font-size: 11px;
            font-weight: 600;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .form-group input {
            width: 100%;
            padding: 10px 12px;
            font-size: 13px;
            border: 2px solid var(--vscode-input-border);
            border-radius: 8px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            transition: all 0.3s ease;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
        }
        
        .form-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            margin-top: 14px;
        }
        
        /* ================================================================ */
        /* \u7A7A\u72B6\u6001 - \u5F15\u5BFC\u8BBE\u8BA1                                                  */
        /* ================================================================ */
        .empty-state {
            text-align: center;
            padding: 30px 20px;
            color: var(--vscode-descriptionForeground);
        }
        
        .empty-state .icon {
            font-size: 40px;
            margin-bottom: 12px;
        }
        
        .empty-state h4 {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 6px;
            color: var(--vscode-foreground);
        }
        
        .empty-state p {
            font-size: 12px;
            line-height: 1.5;
        }
        
        /* ================================================================ */
        /* \u63D0\u793A\u4FE1\u606F                                                          */
        /* ================================================================ */
        .tip {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-top: 16px;
            padding: 12px;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
            border-radius: 10px;
            border-left: 4px solid #667eea;
        }
        
        /* ================================================================ */
        /* \u4F5C\u8005\u6C34\u5370\u533A\u57DF                                                       */
        /* ================================================================ */
        .author-watermark {
            margin-top: 20px;
            padding: 16px;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
            border-radius: 12px;
            border: 1px dashed var(--vscode-panel-border);
            text-align: center;
        }
        
        .author-watermark .author-title {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .author-watermark .author-name {
            font-size: 14px;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 8px;
        }
        
        .author-watermark .author-links {
            display: flex;
            flex-direction: column;
            gap: 4px;
            font-size: 10px;
            color: var(--vscode-descriptionForeground);
        }
        
        .author-watermark .author-links a {
            color: #667eea;
            text-decoration: none;
        }
        
        .author-watermark .author-links a:hover {
            text-decoration: underline;
        }
        
        .author-watermark .github-link {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            margin-top: 8px;
            padding: 6px 12px;
            background: var(--vscode-editor-background);
            border-radius: 20px;
            font-size: 11px;
            color: var(--vscode-foreground);
            text-decoration: none;
            transition: all 0.3s;
        }
        
        .author-watermark .github-link:hover {
            background: #667eea;
            color: #fff;
        }
        
        /* ================================================================ */
        /* \u5F53\u524D\u8D26\u6237\u663E\u793A                                                       */
        /* ================================================================ */
        .current-account {
            background: linear-gradient(135deg, rgba(17, 153, 142, 0.1) 0%, rgba(56, 239, 125, 0.1) 100%);
            border: 1px solid rgba(17, 153, 142, 0.3);
            border-radius: 10px;
            padding: 12px;
            margin-bottom: 16px;
            text-align: center;
        }
        
        .current-account-label {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 4px;
        }
        
        .current-account-info {
            font-size: 13px;
            font-weight: 600;
            color: #11998e;
        }
        
        .current-account-info.not-logged {
            color: var(--vscode-errorForeground);
        }
    </style>
</head>
<body>
    <!-- ================================================================ -->
    <!-- \u5934\u90E8\u533A\u57DF                                                          -->
    <!-- ================================================================ -->
    <div class="header">
        <h2>\u{1F504} Windsurf \u8D26\u6237\u5207\u6362\u5668</h2>
        <p>\u65E0\u9650\u7545\u4EAB \xB7 \u81EA\u7531\u5207\u6362 \xB7 \u5B8C\u5168\u514D\u8D39</p>
        <div class="feature-tags">
            <span class="tag">\u2728 \u65E0\u5FC3\u8DF3\u68C0\u6D4B</span>
            <span class="tag">\u{1F512} \u65E0\u81EA\u52A8\u4E0B\u7EBF</span>
            <span class="tag">\u{1F4BE} \u672C\u5730\u5B58\u50A8</span>
        </div>
    </div>
    
    <!-- ================================================================ -->
    <!-- \u5F53\u524D\u8D26\u6237\u4FE1\u606F                                                      -->
    <!-- ================================================================ -->
    <div class="current-account" id="currentAccount">
        <div class="current-account-label">\u{1F464} \u5F53\u524D\u8D26\u6237</div>
        <div class="current-account-info" id="currentAccountInfo">\u6B63\u5728\u8BFB\u53D6...</div>
    </div>
    
    <!-- ================================================================ -->
    <!-- \u64CD\u4F5C\u6309\u94AE                                                          -->
    <!-- ================================================================ -->
    <div class="actions">
        <button class="btn btn-primary btn-full" onclick="showSaveForm()">
            \u{1F4BE} \u4FDD\u5B58\u5F53\u524D\u8D26\u6237
        </button>
        <button class="btn btn-secondary" onclick="importProfile()">
            \u{1F4E5} \u5BFC\u5165
        </button>
        <button class="btn btn-secondary" onclick="openProfilesDir()">
            \u{1F4C2} \u76EE\u5F55
        </button>
    </div>
    
    <!-- ================================================================ -->
    <!-- \u4FDD\u5B58\u8868\u5355                                                          -->
    <!-- ================================================================ -->
    <div class="save-form" id="saveForm">
        <h3>\u{1F4BE} \u4FDD\u5B58\u5F53\u524D\u8D26\u6237</h3>
        <div class="form-group">
            <label>\u8D26\u6237\u540D\u79F0</label>
            <input type="text" id="profileName" placeholder="\u8F93\u5165\u4E00\u4E2A\u4FBF\u4E8E\u8BC6\u522B\u7684\u540D\u79F0">
        </div>
        <div class="form-group">
            <label>\u90AE\u7BB1\u5730\u5740</label>
            <input type="email" id="profileEmail" placeholder="your@email.com">
        </div>
        <div class="form-actions">
            <button class="btn btn-secondary" onclick="hideSaveForm()">\u53D6\u6D88</button>
            <button class="btn btn-primary" onclick="saveProfile()">\u786E\u8BA4\u4FDD\u5B58</button>
        </div>
    </div>
    
    <!-- ================================================================ -->
    <!-- \u8D26\u6237\u5217\u8868                                                          -->
    <!-- ================================================================ -->
    <div class="section-title">\u{1F4CB} \u5DF2\u4FDD\u5B58\u7684\u8D26\u6237</div>
    <div class="profile-list" id="profileList">
        <div class="empty-state">
            <div class="icon">\u{1F4ED}</div>
            <h4>\u6682\u65E0\u4FDD\u5B58\u7684\u8D26\u6237</h4>
            <p>\u70B9\u51FB\u4E0A\u65B9\u300C\u4FDD\u5B58\u5F53\u524D\u8D26\u6237\u300D\u6309\u94AE<br>\u5F00\u59CB\u7BA1\u7406\u4F60\u7684 Windsurf \u8D26\u6237</p>
        </div>
    </div>
    
    <!-- ================================================================ -->
    <!-- \u63D0\u793A\u4FE1\u606F                                                          -->
    <!-- ================================================================ -->
    <div class="tip">
        \u{1F4A1} <strong>\u63D0\u793A\uFF1A</strong>\u5207\u6362\u8D26\u6237\u540E\u9700\u8981\u91CD\u542F Windsurf \u624D\u80FD\u751F\u6548
    </div>
    
    <!-- ================================================================ -->
    <!-- \u4F5C\u8005\u6C34\u5370                                                          -->
    <!-- ================================================================ -->
    <div class="author-watermark">
        <div class="author-title">\u2728 \u5F00\u53D1\u8005 \u2728</div>
        <div class="author-name">\u4E07\u80FD\u7A0B\u5E8F\u5458\uFF1A\u4F20\u5EB7KK</div>
        <div class="author-links">
            <span>\u{1F4F1} \u5FAE\u4FE1\uFF1A1837620622</span>
            <span>\u{1F4E7} \u90AE\u7BB1\uFF1A2040168455@qq.com</span>
            <span>\u{1F3AC} \u54B8\u9C7C/B\u7AD9\uFF1A\u4E07\u80FD\u7A0B\u5E8F\u5458</span>
        </div>
        <a class="github-link" href="https://github.com/1837620622" target="_blank">
            \u2B50 GitHub: github.com/1837620622
        </a>
    </div>
    
    <!-- ================================================================ -->
    <!-- JavaScript \u903B\u8F91                                                   -->
    <!-- ================================================================ -->
    <script>
        // VSCode API \u5BF9\u8C61
        const vscode = acquireVsCodeApi();
        
        // \u5F53\u524D\u8D26\u6237\u5217\u8868
        let profiles = [];
        let currentProfileId = '';
        let currentAccount = null;
        
        // ============================================================
        // \u521D\u59CB\u5316
        // ============================================================
        window.addEventListener('load', () => {
            // \u8BF7\u6C42\u8D26\u6237\u5217\u8868
            vscode.postMessage({ type: 'getProfiles' });
            // \u8BF7\u6C42\u5F53\u524D\u8D26\u6237\u4FE1\u606F
            vscode.postMessage({ type: 'getCurrentAccount' });
        });
        
        // ============================================================
        // \u6D88\u606F\u5904\u7406
        // ============================================================
        window.addEventListener('message', (event) => {
            const message = event.data;
            
            if (message.type === 'profiles') {
                profiles = message.profiles || [];
                currentProfileId = message.currentProfile || '';
                renderProfiles();
            }
            
            if (message.type === 'currentAccount') {
                currentAccount = message.account;
                updateCurrentAccountDisplay();
            }
        });
        
        // ============================================================
        // \u66F4\u65B0\u5F53\u524D\u8D26\u6237\u663E\u793A
        // ============================================================
        function updateCurrentAccountDisplay() {
            const infoEl = document.getElementById('currentAccountInfo');
            if (currentAccount && currentAccount.email) {
                infoEl.textContent = currentAccount.name + ' (' + currentAccount.email + ')';
                infoEl.classList.remove('not-logged');
            } else {
                infoEl.textContent = '\u672A\u767B\u5F55\u6216\u65E0\u6CD5\u8BFB\u53D6';
                infoEl.classList.add('not-logged');
            }
        }
        
        // ============================================================
        // \u6E32\u67D3\u8D26\u6237\u5217\u8868
        // ============================================================
        function renderProfiles() {
            const container = document.getElementById('profileList');
            
            if (profiles.length === 0) {
                container.innerHTML = \`
                    <div class="empty-state">
                        <div class="icon">\u{1F4ED}</div>
                        <h4>\u6682\u65E0\u4FDD\u5B58\u7684\u8D26\u6237</h4>
                        <p>\u70B9\u51FB\u4E0A\u65B9\u300C\u4FDD\u5B58\u5F53\u524D\u8D26\u6237\u300D\u6309\u94AE<br>\u5F00\u59CB\u7BA1\u7406\u4F60\u7684 Windsurf \u8D26\u6237</p>
                    </div>
                \`;
                return;
            }
            
            container.innerHTML = profiles.map(profile => \`
                <div class="profile-item \${profile.id === currentProfileId ? 'active' : ''}">
                    <div class="profile-header">
                        <div class="profile-info">
                            <h3>\u{1F464} \${escapeHtml(profile.name)}</h3>
                            <div class="email">\u{1F4E7} \${escapeHtml(profile.email)}</div>
                            <div class="time">\u{1F550} \${escapeHtml(profile.savedAt)}</div>
                        </div>
                        \${profile.id === currentProfileId ? '<span class="profile-badge">\u2713 \u5F53\u524D</span>' : ''}
                    </div>
                    <div class="profile-actions">
                        \${profile.id !== currentProfileId ? 
                            \`<button class="btn btn-success" onclick="switchProfile('\${profile.id}')">\u{1F504} \u5207\u6362</button>\` : 
                            '<button class="btn btn-secondary" disabled>\u2713 \u5DF2\u6FC0\u6D3B</button>'
                        }
                        <button class="btn btn-secondary" onclick="exportProfile('\${profile.id}')">\u{1F4E4} \u5BFC\u51FA</button>
                        <button class="btn btn-danger" onclick="deleteProfile('\${profile.id}')">\u{1F5D1}\uFE0F \u5220\u9664</button>
                    </div>
                </div>
            \`).join('');
        }
        
        // ============================================================
        // \u663E\u793A/\u9690\u85CF\u4FDD\u5B58\u8868\u5355
        // ============================================================
        function showSaveForm() {
            document.getElementById('saveForm').classList.add('show');
            // \u81EA\u52A8\u586B\u5145\u5F53\u524D\u8D26\u6237\u4FE1\u606F
            if (currentAccount && currentAccount.email) {
                document.getElementById('profileName').value = currentAccount.name || currentAccount.email.split('@')[0];
                document.getElementById('profileEmail').value = currentAccount.email;
            }
        }
        
        function hideSaveForm() {
            document.getElementById('saveForm').classList.remove('show');
            document.getElementById('profileName').value = '';
            document.getElementById('profileEmail').value = '';
        }
        
        // ============================================================
        // \u4FDD\u5B58\u8D26\u6237
        // ============================================================
        function saveProfile() {
            const name = document.getElementById('profileName').value.trim();
            const email = document.getElementById('profileEmail').value.trim();
            
            if (!name) {
                alert('\u8BF7\u8F93\u5165\u8D26\u6237\u540D\u79F0');
                return;
            }
            
            vscode.postMessage({
                type: 'saveProfile',
                name: name,
                email: email || 'unknown@example.com'
            });
            
            hideSaveForm();
        }
        
        // ============================================================
        // \u5207\u6362\u8D26\u6237
        // ============================================================
        function switchProfile(profileId) {
            vscode.postMessage({
                type: 'switchProfile',
                profileId: profileId
            });
        }
        
        // ============================================================
        // \u5220\u9664\u8D26\u6237
        // ============================================================
        function deleteProfile(profileId) {
            vscode.postMessage({
                type: 'deleteProfile',
                profileId: profileId
            });
        }
        
        // ============================================================
        // \u5BFC\u5165\u8D26\u6237
        // ============================================================
        function importProfile() {
            vscode.postMessage({ type: 'importProfile' });
        }
        
        // ============================================================
        // \u5BFC\u51FA\u8D26\u6237
        // ============================================================
        function exportProfile(profileId) {
            vscode.postMessage({
                type: 'exportProfile',
                profileId: profileId
            });
        }
        
        // ============================================================
        // \u6253\u5F00\u914D\u7F6E\u76EE\u5F55
        // ============================================================
        function openProfilesDir() {
            vscode.postMessage({ type: 'openProfilesDir' });
        }
        
        // ============================================================
        // HTML \u8F6C\u4E49
        // ============================================================
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    </script>
</body>
</html>`}};function O(n){console.log("Windsurf Switcher Free \u5DF2\u6FC0\u6D3B");let e=new I,o=new F(n.extensionUri,e);n.subscriptions.push(a.window.registerWebviewViewProvider("windsurfSwitcherFree.view",o)),n.subscriptions.push(a.commands.registerCommand("windsurfSwitcherFree.refresh",()=>{o.refresh()})),n.subscriptions.push(a.commands.registerCommand("windsurfSwitcherFree.importProfile",async()=>{let i=await a.window.showOpenDialog({canSelectFiles:!1,canSelectFolders:!0,canSelectMany:!1,title:"\u9009\u62E9\u8981\u5BFC\u5165\u7684\u8D26\u6237\u914D\u7F6E\u76EE\u5F55"});if(i&&i.length>0){let t=e.importProfile(i[0].fsPath);t&&(a.window.showInformationMessage(`\u8D26\u6237 "${t.name}" \u5BFC\u5165\u6210\u529F\uFF01`),o.refresh())}})),a.window.showInformationMessage("Windsurf Switcher Free \u5DF2\u542F\u52A8 - \u65E0\u5FC3\u8DF3\u68C0\u6D4B\uFF0C\u65E0\u81EA\u52A8\u4E0B\u7EBF")}function H(){console.log("Windsurf Switcher Free \u5DF2\u505C\u7528")}0&&(module.exports={activate,deactivate});
