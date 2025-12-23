"use strict";var W=Object.create;var y=Object.defineProperty;var $=Object.getOwnPropertyDescriptor;var L=Object.getOwnPropertyNames;var B=Object.getPrototypeOf,_=Object.prototype.hasOwnProperty;var z=(s,e)=>{for(var o in e)y(s,o,{get:e[o],enumerable:!0})},C=(s,e,o,t)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of L(e))!_.call(s,r)&&r!==o&&y(s,r,{get:()=>e[r],enumerable:!(t=$(e,r))||t.enumerable});return s};var P=(s,e,o)=>(o=s!=null?W(B(s)):{},C(e||!s||!s.__esModule?y(o,"default",{value:s,enumerable:!0}):o,s)),N=s=>C(y({},"__esModule",{value:!0}),s);var H={};z(H,{activate:()=>T,deactivate:()=>A});module.exports=N(H);var a=P(require("vscode")),i=P(require("fs")),n=P(require("path")),w=P(require("os")),M=n.join(w.homedir(),"Library","Application Support","Windsurf"),b=n.join(M,"User","globalStorage"),x=n.join(w.homedir(),".windsurf-switcher-free"),S=n.join(x,"profiles.json");function v(s){i.existsSync(s)||i.mkdirSync(s,{recursive:!0})}function E(){return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,s=>{let e=Math.random()*16|0;return(s==="x"?e:e&3|8).toString(16)})}function k(){return new Date().toLocaleString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit"})}function g(s,e,o=[]){v(e);let t=i.readdirSync(s,{withFileTypes:!0});for(let r of t){if(o.some(c=>c.startsWith("*.")?r.name.endsWith(c.slice(1)):c.endsWith("*")?r.name.startsWith(c.slice(0,-1)):r.name===c))continue;let f=n.join(s,r.name),l=n.join(e,r.name);r.isDirectory()?g(f,l,o):i.copyFileSync(f,l)}}function F(s){i.existsSync(s)&&i.rmSync(s,{recursive:!0,force:!0})}var I=class{constructor(){this.storageData=this.loadStorage()}loadStorage(){if(v(x),i.existsSync(S))try{let e=i.readFileSync(S,"utf-8");return JSON.parse(e)}catch(e){console.error("\u52A0\u8F7D\u914D\u7F6E\u6587\u4EF6\u5931\u8D25:",e)}return{profiles:[],currentProfile:""}}saveStorage(){v(x),i.writeFileSync(S,JSON.stringify(this.storageData,null,2))}getProfiles(){return this.storageData.profiles}getCurrentProfileId(){return this.storageData.currentProfile}saveCurrentProfile(e,o){let t=E(),r=n.join(x,"profiles",t);v(r);let d=n.join(r,"globalStorage");i.existsSync(b)&&g(b,d,["*.backup.*","ms-*"]);let f=["Cookies","Cookies-journal","Local Storage","Session Storage","Network Persistent State"];for(let m of f){let u=n.join(M,m),h=n.join(r,m);i.existsSync(u)&&(i.statSync(u).isDirectory()?g(u,h):i.copyFileSync(u,h))}let l=n.join(w.homedir(),".codeium","windsurf"),c=n.join(r,"codeium");if(i.existsSync(l)){v(c);let m=["installation_id","user_settings.pb"];for(let u of m){let h=n.join(l,u);i.existsSync(h)&&i.copyFileSync(h,n.join(c,u))}}let p={id:t,name:e,email:o,savedAt:k(),profilePath:r},j=n.join(r,"profile_meta.json");return i.writeFileSync(j,JSON.stringify({name:e,email:o,saved_at:k()},null,2)),this.storageData.profiles.push(p),this.storageData.currentProfile=t,this.saveStorage(),p}importProfile(e){let o=n.join(e,"profile_meta.json"),t="\u5BFC\u5165\u7684\u8D26\u6237",r="unknown@example.com";if(i.existsSync(o))try{let c=JSON.parse(i.readFileSync(o,"utf-8"));t=c.name||t,r=c.email||r}catch(c){console.error("\u8BFB\u53D6 profile_meta.json \u5931\u8D25:",c)}let d=E(),f=n.join(x,"profiles",d);g(e,f);let l={id:d,name:t,email:r,savedAt:k(),profilePath:f};return this.storageData.profiles.push(l),this.saveStorage(),l}switchProfile(e){let o=this.storageData.profiles.find(t=>t.id===e);if(!o)return!1;if(!i.existsSync(o.profilePath))return a.window.showErrorMessage(`\u8D26\u6237\u914D\u7F6E\u76EE\u5F55\u4E0D\u5B58\u5728: ${o.profilePath}`),!1;try{let t=n.join(o.profilePath,"globalStorage");i.existsSync(t)&&(i.existsSync(b)&&F(b),g(t,b));let r=["Cookies","Cookies-journal","Local Storage","Session Storage","Network Persistent State"];for(let l of r){let c=n.join(o.profilePath,l),p=n.join(M,l);i.existsSync(c)&&(i.existsSync(p)&&(i.statSync(p).isDirectory()?F(p):i.unlinkSync(p)),i.statSync(c).isDirectory()?g(c,p):i.copyFileSync(c,p))}let d=n.join(o.profilePath,"codeium"),f=n.join(w.homedir(),".codeium","windsurf");if(i.existsSync(d)){v(f);let l=i.readdirSync(d);for(let c of l)i.copyFileSync(n.join(d,c),n.join(f,c))}return this.storageData.currentProfile=e,this.saveStorage(),!0}catch(t){return console.error("\u5207\u6362\u8D26\u6237\u5931\u8D25:",t),a.window.showErrorMessage(`\u5207\u6362\u8D26\u6237\u5931\u8D25: ${t}`),!1}}deleteProfile(e){let o=this.storageData.profiles.findIndex(r=>r.id===e);if(o===-1)return!1;let t=this.storageData.profiles[o];return F(t.profilePath),this.storageData.profiles.splice(o,1),this.storageData.currentProfile===e&&(this.storageData.currentProfile=""),this.saveStorage(),!0}exportProfile(e,o){let t=this.storageData.profiles.find(r=>r.id===e);if(!t)return!1;try{return g(t.profilePath,o),!0}catch(r){return console.error("\u5BFC\u51FA\u8D26\u6237\u5931\u8D25:",r),!1}}},D=class{constructor(e,o){this.extensionUri=e;this.profileManager=o}resolveWebviewView(e,o,t){this._view=e,e.webview.options={enableScripts:!0,localResourceRoots:[this.extensionUri]},e.webview.html=this.getHtmlContent(),e.webview.onDidReceiveMessage(async r=>{switch(r.type){case"getProfiles":this.sendProfiles();break;case"saveProfile":await this.handleSaveProfile(r.name,r.email);break;case"switchProfile":await this.handleSwitchProfile(r.profileId);break;case"deleteProfile":await this.handleDeleteProfile(r.profileId);break;case"importProfile":await this.handleImportProfile();break;case"exportProfile":await this.handleExportProfile(r.profileId);break}})}sendProfiles(){this._view&&this._view.webview.postMessage({type:"profiles",profiles:this.profileManager.getProfiles(),currentProfile:this.profileManager.getCurrentProfileId()})}async handleSaveProfile(e,o){try{this.profileManager.saveCurrentProfile(e,o),a.window.showInformationMessage(`\u8D26\u6237 "${e}" \u4FDD\u5B58\u6210\u529F\uFF01`),this.sendProfiles()}catch(t){a.window.showErrorMessage(`\u4FDD\u5B58\u8D26\u6237\u5931\u8D25: ${t}`)}}async handleSwitchProfile(e){let o=this.profileManager.getProfiles().find(r=>r.id===e);if(!o)return;await a.window.showWarningMessage(`\u786E\u5B9A\u8981\u5207\u6362\u5230\u8D26\u6237 "${o.name}" \u5417\uFF1F
\u5207\u6362\u540E\u9700\u8981\u91CD\u542F Windsurf \u624D\u80FD\u751F\u6548\u3002`,"\u786E\u5B9A\u5207\u6362","\u53D6\u6D88")==="\u786E\u5B9A\u5207\u6362"&&this.profileManager.switchProfile(e)&&(await a.window.showInformationMessage(`\u5DF2\u5207\u6362\u5230\u8D26\u6237 "${o.name}"\uFF0C\u9700\u8981\u91CD\u542F Windsurf \u624D\u80FD\u751F\u6548\u3002`,"\u7ACB\u5373\u91CD\u542F","\u7A0D\u540E\u91CD\u542F")==="\u7ACB\u5373\u91CD\u542F"&&a.commands.executeCommand("workbench.action.reloadWindow"),this.sendProfiles())}async handleDeleteProfile(e){let o=this.profileManager.getProfiles().find(r=>r.id===e);if(!o)return;await a.window.showWarningMessage(`\u786E\u5B9A\u8981\u5220\u9664\u8D26\u6237 "${o.name}" \u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002`,"\u786E\u5B9A\u5220\u9664","\u53D6\u6D88")==="\u786E\u5B9A\u5220\u9664"&&this.profileManager.deleteProfile(e)&&(a.window.showInformationMessage(`\u8D26\u6237 "${o.name}" \u5DF2\u5220\u9664\u3002`),this.sendProfiles())}async handleImportProfile(){let e=await a.window.showOpenDialog({canSelectFiles:!1,canSelectFolders:!0,canSelectMany:!1,title:"\u9009\u62E9\u8981\u5BFC\u5165\u7684\u8D26\u6237\u914D\u7F6E\u76EE\u5F55"});if(e&&e.length>0){let o=this.profileManager.importProfile(e[0].fsPath);o?(a.window.showInformationMessage(`\u8D26\u6237 "${o.name}" \u5BFC\u5165\u6210\u529F\uFF01`),this.sendProfiles()):a.window.showErrorMessage("\u5BFC\u5165\u8D26\u6237\u5931\u8D25")}}async handleExportProfile(e){let o=this.profileManager.getProfiles().find(r=>r.id===e);if(!o)return;let t=await a.window.showOpenDialog({canSelectFiles:!1,canSelectFolders:!0,canSelectMany:!1,title:"\u9009\u62E9\u5BFC\u51FA\u76EE\u6807\u76EE\u5F55"});if(t&&t.length>0){let r=n.join(t[0].fsPath,`windsurf-profile-${o.name}`);this.profileManager.exportProfile(e,r)?a.window.showInformationMessage(`\u8D26\u6237\u5DF2\u5BFC\u51FA\u5230: ${r}`):a.window.showErrorMessage("\u5BFC\u51FA\u8D26\u6237\u5931\u8D25")}}refresh(){this.sendProfiles()}getHtmlContent(){return`<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Windsurf \u8D26\u6237\u5207\u6362</title>
    <style>
        /* ================================================================ */
        /* \u57FA\u7840\u6837\u5F0F                                                          */
        /* ================================================================ */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-sideBar-background);
            padding: 12px;
        }
        
        /* ================================================================ */
        /* \u6807\u9898\u533A\u57DF                                                          */
        /* ================================================================ */
        .header {
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .header h2 {
            font-size: 14px;
            font-weight: 600;
            color: var(--vscode-foreground);
            margin-bottom: 4px;
        }
        
        .header p {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
        }
        
        /* ================================================================ */
        /* \u64CD\u4F5C\u6309\u94AE\u533A\u57DF                                                       */
        /* ================================================================ */
        .actions {
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
            flex-wrap: wrap;
        }
        
        .btn {
            padding: 6px 12px;
            font-size: 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .btn-primary {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        
        .btn-primary:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .btn-secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        
        .btn-secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        
        .btn-danger {
            background-color: #c42b1c;
            color: white;
        }
        
        .btn-danger:hover {
            background-color: #a52714;
        }
        
        /* ================================================================ */
        /* \u8D26\u6237\u5217\u8868                                                          */
        /* ================================================================ */
        .profile-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .profile-item {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            padding: 12px;
            transition: all 0.2s;
        }
        
        .profile-item:hover {
            border-color: var(--vscode-focusBorder);
        }
        
        .profile-item.active {
            border-color: var(--vscode-button-background);
            background-color: var(--vscode-list-activeSelectionBackground);
        }
        
        .profile-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
        }
        
        .profile-info h3 {
            font-size: 13px;
            font-weight: 600;
            color: var(--vscode-foreground);
            margin-bottom: 2px;
        }
        
        .profile-info .email {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
        }
        
        .profile-info .time {
            font-size: 10px;
            color: var(--vscode-descriptionForeground);
            margin-top: 4px;
        }
        
        .profile-badge {
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 10px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        
        .profile-actions {
            display: flex;
            gap: 6px;
            margin-top: 8px;
        }
        
        .profile-actions .btn {
            padding: 4px 8px;
            font-size: 11px;
        }
        
        /* ================================================================ */
        /* \u4FDD\u5B58\u8868\u5355                                                          */
        /* ================================================================ */
        .save-form {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 16px;
            display: none;
        }
        
        .save-form.show {
            display: block;
        }
        
        .save-form h3 {
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 12px;
        }
        
        .form-group {
            margin-bottom: 10px;
        }
        
        .form-group label {
            display: block;
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 4px;
        }
        
        .form-group input {
            width: 100%;
            padding: 6px 8px;
            font-size: 12px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
        }
        
        .form-group input:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
        
        .form-actions {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
        }
        
        /* ================================================================ */
        /* \u7A7A\u72B6\u6001                                                            */
        /* ================================================================ */
        .empty-state {
            text-align: center;
            padding: 24px;
            color: var(--vscode-descriptionForeground);
        }
        
        .empty-state p {
            font-size: 12px;
            margin-bottom: 12px;
        }
        
        /* ================================================================ */
        /* \u63D0\u793A\u4FE1\u606F                                                          */
        /* ================================================================ */
        .tip {
            font-size: 10px;
            color: var(--vscode-descriptionForeground);
            margin-top: 16px;
            padding: 8px;
            background-color: var(--vscode-textBlockQuote-background);
            border-radius: 4px;
            border-left: 3px solid var(--vscode-textLink-foreground);
        }
    </style>
</head>
<body>
    <!-- ================================================================ -->
    <!-- \u5934\u90E8\u533A\u57DF                                                          -->
    <!-- ================================================================ -->
    <div class="header">
        <h2>\u{1F504} Windsurf \u8D26\u6237\u5207\u6362</h2>
        <p>\u65E0\u5FC3\u8DF3\u68C0\u6D4B \xB7 \u65E0\u81EA\u52A8\u4E0B\u7EBF \xB7 \u5B8C\u5168\u672C\u5730\u5316</p>
    </div>
    
    <!-- ================================================================ -->
    <!-- \u64CD\u4F5C\u6309\u94AE                                                          -->
    <!-- ================================================================ -->
    <div class="actions">
        <button class="btn btn-primary" onclick="showSaveForm()">
            \u{1F4BE} \u4FDD\u5B58\u5F53\u524D\u8D26\u6237
        </button>
        <button class="btn btn-secondary" onclick="importProfile()">
            \u{1F4E5} \u5BFC\u5165\u914D\u7F6E
        </button>
    </div>
    
    <!-- ================================================================ -->
    <!-- \u4FDD\u5B58\u8868\u5355                                                          -->
    <!-- ================================================================ -->
    <div class="save-form" id="saveForm">
        <h3>\u4FDD\u5B58\u5F53\u524D\u8D26\u6237</h3>
        <div class="form-group">
            <label for="profileName">\u8D26\u6237\u540D\u79F0</label>
            <input type="text" id="profileName" placeholder="\u4F8B\u5982\uFF1A\u5DE5\u4F5C\u8D26\u6237">
        </div>
        <div class="form-group">
            <label for="profileEmail">\u90AE\u7BB1</label>
            <input type="email" id="profileEmail" placeholder="\u4F8B\u5982\uFF1Aexample@email.com">
        </div>
        <div class="form-actions">
            <button class="btn btn-secondary" onclick="hideSaveForm()">\u53D6\u6D88</button>
            <button class="btn btn-primary" onclick="saveProfile()">\u4FDD\u5B58</button>
        </div>
    </div>
    
    <!-- ================================================================ -->
    <!-- \u8D26\u6237\u5217\u8868                                                          -->
    <!-- ================================================================ -->
    <div class="profile-list" id="profileList">
        <div class="empty-state">
            <p>\u6682\u65E0\u4FDD\u5B58\u7684\u8D26\u6237</p>
            <p>\u70B9\u51FB\u300C\u4FDD\u5B58\u5F53\u524D\u8D26\u6237\u300D\u5F00\u59CB\u4F7F\u7528</p>
        </div>
    </div>
    
    <!-- ================================================================ -->
    <!-- \u63D0\u793A\u4FE1\u606F                                                          -->
    <!-- ================================================================ -->
    <div class="tip">
        \u{1F4A1} \u63D0\u793A\uFF1A\u5207\u6362\u8D26\u6237\u540E\u9700\u8981\u91CD\u542F Windsurf \u624D\u80FD\u751F\u6548
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
        
        // ============================================================
        // \u521D\u59CB\u5316
        // ============================================================
        window.addEventListener('load', () => {
            // \u8BF7\u6C42\u8D26\u6237\u5217\u8868
            vscode.postMessage({ type: 'getProfiles' });
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
        });
        
        // ============================================================
        // \u6E32\u67D3\u8D26\u6237\u5217\u8868
        // ============================================================
        function renderProfiles() {
            const container = document.getElementById('profileList');
            
            if (profiles.length === 0) {
                container.innerHTML = \`
                    <div class="empty-state">
                        <p>\u6682\u65E0\u4FDD\u5B58\u7684\u8D26\u6237</p>
                        <p>\u70B9\u51FB\u300C\u4FDD\u5B58\u5F53\u524D\u8D26\u6237\u300D\u5F00\u59CB\u4F7F\u7528</p>
                    </div>
                \`;
                return;
            }
            
            container.innerHTML = profiles.map(profile => \`
                <div class="profile-item \${profile.id === currentProfileId ? 'active' : ''}">
                    <div class="profile-header">
                        <div class="profile-info">
                            <h3>\${escapeHtml(profile.name)}</h3>
                            <div class="email">\${escapeHtml(profile.email)}</div>
                            <div class="time">\u4FDD\u5B58\u4E8E: \${escapeHtml(profile.savedAt)}</div>
                        </div>
                        \${profile.id === currentProfileId ? '<span class="profile-badge">\u5F53\u524D</span>' : ''}
                    </div>
                    <div class="profile-actions">
                        \${profile.id !== currentProfileId ? 
                            \`<button class="btn btn-primary" onclick="switchProfile('\${profile.id}')">\u5207\u6362</button>\` : 
                            ''
                        }
                        <button class="btn btn-secondary" onclick="exportProfile('\${profile.id}')">\u5BFC\u51FA</button>
                        <button class="btn btn-danger" onclick="deleteProfile('\${profile.id}')">\u5220\u9664</button>
                    </div>
                </div>
            \`).join('');
        }
        
        // ============================================================
        // \u663E\u793A/\u9690\u85CF\u4FDD\u5B58\u8868\u5355
        // ============================================================
        function showSaveForm() {
            document.getElementById('saveForm').classList.add('show');
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
        // HTML \u8F6C\u4E49
        // ============================================================
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    </script>
</body>
</html>`}};function T(s){console.log("Windsurf Switcher Free \u5DF2\u6FC0\u6D3B");let e=new I,o=new D(s.extensionUri,e);s.subscriptions.push(a.window.registerWebviewViewProvider("windsurfSwitcherFree.view",o)),s.subscriptions.push(a.commands.registerCommand("windsurfSwitcherFree.refresh",()=>{o.refresh()})),s.subscriptions.push(a.commands.registerCommand("windsurfSwitcherFree.importProfile",async()=>{let t=await a.window.showOpenDialog({canSelectFiles:!1,canSelectFolders:!0,canSelectMany:!1,title:"\u9009\u62E9\u8981\u5BFC\u5165\u7684\u8D26\u6237\u914D\u7F6E\u76EE\u5F55"});if(t&&t.length>0){let r=e.importProfile(t[0].fsPath);r&&(a.window.showInformationMessage(`\u8D26\u6237 "${r.name}" \u5BFC\u5165\u6210\u529F\uFF01`),o.refresh())}})),a.window.showInformationMessage("Windsurf Switcher Free \u5DF2\u542F\u52A8 - \u65E0\u5FC3\u8DF3\u68C0\u6D4B\uFF0C\u65E0\u81EA\u52A8\u4E0B\u7EBF")}function A(){console.log("Windsurf Switcher Free \u5DF2\u505C\u7528")}0&&(module.exports={activate,deactivate});
