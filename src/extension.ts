// ============================================================================
// Windsurf Switcher Free - 账户切换插件
// 功能：本地账户配置管理，无心跳检测，无自动下线，完全离线使用
// 作者：Vx:1837620622（传康kk）、邮箱 2040168455@qq.com、咸鱼/B站：万能程序员
// ============================================================================

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 账户配置接口
 * 存储 Windsurf 账户的基本信息和配置文件路径
 */
interface ProfileConfig {
    id: string;           // 唯一标识符
    name: string;         // 账户显示名称
    email: string;        // 账户邮箱
    savedAt: string;      // 保存时间
    profilePath: string;  // 配置文件目录路径
}

/**
 * 存储数据接口
 * 用于持久化存储所有账户配置
 */
interface StorageData {
    profiles: ProfileConfig[];  // 账户列表
    currentProfile: string;     // 当前激活的账户ID
}

// ============================================================================
// 全局变量
// ============================================================================

// Windsurf 配置目录路径（macOS）
const WINDSURF_CONFIG_PATH = path.join(
    os.homedir(),
    'Library',
    'Application Support',
    'Windsurf'
);

// ★★★ 核心：globalStorage 目录路径（包含认证信息的关键目录）★★★
const WINDSURF_GLOBAL_STORAGE = path.join(
    WINDSURF_CONFIG_PATH,
    'User',
    'globalStorage'
);

// 插件数据存储目录
const PLUGIN_DATA_PATH = path.join(
    os.homedir(),
    '.windsurf-switcher-free'
);

// 账户配置存储文件
const PROFILES_FILE = path.join(PLUGIN_DATA_PATH, 'profiles.json');

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 确保目录存在，如果不存在则创建
 * @param dirPath 目录路径
 */
function ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * 生成唯一ID
 * @returns UUID 字符串
 */
function generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * 获取当前时间的格式化字符串
 * @returns 格式化的日期时间字符串
 */
function getCurrentTime(): string {
    const now = new Date();
    return now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

/**
 * 复制目录及其内容
 * @param src 源目录
 * @param dest 目标目录
 * @param ignorePatterns 可选的忽略模式数组
 */
function copyDir(src: string, dest: string, ignorePatterns: string[] = []): void {
    ensureDir(dest);
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
        // 检查是否匹配忽略模式
        const shouldIgnore = ignorePatterns.some(pattern => {
            if (pattern.startsWith('*.')) {
                // 扩展名匹配
                return entry.name.endsWith(pattern.slice(1));
            }
            if (pattern.endsWith('*')) {
                // 前缀匹配
                return entry.name.startsWith(pattern.slice(0, -1));
            }
            return entry.name === pattern;
        });
        
        if (shouldIgnore) {
            continue;
        }
        
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath, ignorePatterns);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

/**
 * 删除目录及其内容
 * @param dirPath 目录路径
 */
function removeDir(dirPath: string): void {
    if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
    }
}

// ============================================================================
// 配置管理类
// ============================================================================

/**
 * ProfileManager - 账户配置管理器
 * 负责账户配置的增删改查和切换操作
 */
class ProfileManager {
    private storageData: StorageData;

    constructor() {
        this.storageData = this.loadStorage();
    }

    /**
     * 加载存储数据
     * @returns 存储数据对象
     */
    private loadStorage(): StorageData {
        ensureDir(PLUGIN_DATA_PATH);
        
        if (fs.existsSync(PROFILES_FILE)) {
            try {
                const data = fs.readFileSync(PROFILES_FILE, 'utf-8');
                return JSON.parse(data);
            } catch (error) {
                console.error('加载配置文件失败:', error);
            }
        }
        
        return { profiles: [], currentProfile: '' };
    }

    /**
     * 保存存储数据
     */
    private saveStorage(): void {
        ensureDir(PLUGIN_DATA_PATH);
        fs.writeFileSync(PROFILES_FILE, JSON.stringify(this.storageData, null, 2));
    }

    /**
     * 获取所有账户配置
     * @returns 账户配置数组
     */
    getProfiles(): ProfileConfig[] {
        return this.storageData.profiles;
    }

    /**
     * 获取当前账户ID
     * @returns 当前账户ID
     */
    getCurrentProfileId(): string {
        return this.storageData.currentProfile;
    }

    /**
     * 保存当前 Windsurf 配置为新账户
     * @param name 账户名称
     * @param email 账户邮箱
     * @returns 新创建的账户配置
     */
    saveCurrentProfile(name: string, email: string): ProfileConfig {
        const id = generateId();
        const profilePath = path.join(PLUGIN_DATA_PATH, 'profiles', id);
        
        // 复制当前 Windsurf 配置
        ensureDir(profilePath);
        
        // ★★★ 核心改进：复制整个 globalStorage 目录（包含认证信息）★★★
        const globalStorageBackup = path.join(profilePath, 'globalStorage');
        if (fs.existsSync(WINDSURF_GLOBAL_STORAGE)) {
            // 复制整个目录，排除大型备份文件和 ms-* 目录
            copyDir(WINDSURF_GLOBAL_STORAGE, globalStorageBackup, ['*.backup.*', 'ms-*']);
        }
        
        // 需要复制的其他配置目录/文件
        const itemsToCopy = [
            'Cookies',
            'Cookies-journal',
            'Local Storage',
            'Session Storage',
            'Network Persistent State'
        ];
        
        for (const item of itemsToCopy) {
            const srcPath = path.join(WINDSURF_CONFIG_PATH, item);
            const destPath = path.join(profilePath, item);
            
            if (fs.existsSync(srcPath)) {
                const stat = fs.statSync(srcPath);
                if (stat.isDirectory()) {
                    copyDir(srcPath, destPath);
                } else {
                    fs.copyFileSync(srcPath, destPath);
                }
            }
        }
        
        // 复制 codeium 配置（从用户目录）
        const codeiumSrc = path.join(os.homedir(), '.codeium', 'windsurf');
        const codeiumDest = path.join(profilePath, 'codeium');
        if (fs.existsSync(codeiumSrc)) {
            ensureDir(codeiumDest);
            // 只复制关键文件，不复制大型缓存
            const codeiumFiles = ['installation_id', 'user_settings.pb'];
            for (const file of codeiumFiles) {
                const src = path.join(codeiumSrc, file);
                if (fs.existsSync(src)) {
                    fs.copyFileSync(src, path.join(codeiumDest, file));
                }
            }
        }
        
        // 保存账户元信息
        const profile: ProfileConfig = {
            id,
            name,
            email,
            savedAt: getCurrentTime(),
            profilePath
        };
        
        // 保存 profile_meta.json
        const metaPath = path.join(profilePath, 'profile_meta.json');
        fs.writeFileSync(metaPath, JSON.stringify({
            name,
            email,
            saved_at: getCurrentTime()
        }, null, 2));
        
        this.storageData.profiles.push(profile);
        this.storageData.currentProfile = id;
        this.saveStorage();
        
        return profile;
    }

    /**
     * 从目录导入账户配置
     * @param sourcePath 源配置目录路径
     * @returns 导入的账户配置，如果失败返回 null
     */
    importProfile(sourcePath: string): ProfileConfig | null {
        // 检查是否存在 profile_meta.json
        const metaPath = path.join(sourcePath, 'profile_meta.json');
        let name = '导入的账户';
        let email = 'unknown@example.com';
        
        if (fs.existsSync(metaPath)) {
            try {
                const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
                name = meta.name || name;
                email = meta.email || email;
            } catch (error) {
                console.error('读取 profile_meta.json 失败:', error);
            }
        }
        
        const id = generateId();
        const profilePath = path.join(PLUGIN_DATA_PATH, 'profiles', id);
        
        // 复制整个目录
        copyDir(sourcePath, profilePath);
        
        const profile: ProfileConfig = {
            id,
            name,
            email,
            savedAt: getCurrentTime(),
            profilePath
        };
        
        this.storageData.profiles.push(profile);
        this.saveStorage();
        
        return profile;
    }

    /**
     * 切换到指定账户
     * @param profileId 目标账户ID
     * @returns 是否切换成功
     */
    switchProfile(profileId: string): boolean {
        const profile = this.storageData.profiles.find(p => p.id === profileId);
        if (!profile) {
            return false;
        }
        
        // 检查配置目录是否存在
        if (!fs.existsSync(profile.profilePath)) {
            vscode.window.showErrorMessage(`账户配置目录不存在: ${profile.profilePath}`);
            return false;
        }
        
        try {
            // ★★★ 核心改进：检查并还原整个 globalStorage 目录 ★★★
            const globalStorageBackup = path.join(profile.profilePath, 'globalStorage');
            if (fs.existsSync(globalStorageBackup)) {
                // 删除现有的 globalStorage 目录
                if (fs.existsSync(WINDSURF_GLOBAL_STORAGE)) {
                    removeDir(WINDSURF_GLOBAL_STORAGE);
                }
                // 复制备份的 globalStorage 目录
                copyDir(globalStorageBackup, WINDSURF_GLOBAL_STORAGE);
            }
            
            // 需要替换的其他配置项
            const itemsToReplace = [
                'Cookies',
                'Cookies-journal',
                'Local Storage',
                'Session Storage',
                'Network Persistent State'
            ];
            
            for (const item of itemsToReplace) {
                const srcPath = path.join(profile.profilePath, item);
                const destPath = path.join(WINDSURF_CONFIG_PATH, item);
                
                if (fs.existsSync(srcPath)) {
                    // 先删除目标
                    if (fs.existsSync(destPath)) {
                        const stat = fs.statSync(destPath);
                        if (stat.isDirectory()) {
                            removeDir(destPath);
                        } else {
                            fs.unlinkSync(destPath);
                        }
                    }
                    
                    // 复制源文件/目录
                    const srcStat = fs.statSync(srcPath);
                    if (srcStat.isDirectory()) {
                        copyDir(srcPath, destPath);
                    } else {
                        fs.copyFileSync(srcPath, destPath);
                    }
                }
            }
            
            // 还原 codeium 配置
            const codeiumBackup = path.join(profile.profilePath, 'codeium');
            const codeiumDest = path.join(os.homedir(), '.codeium', 'windsurf');
            if (fs.existsSync(codeiumBackup)) {
                ensureDir(codeiumDest);
                const files = fs.readdirSync(codeiumBackup);
                for (const file of files) {
                    fs.copyFileSync(
                        path.join(codeiumBackup, file),
                        path.join(codeiumDest, file)
                    );
                }
            }
            
            this.storageData.currentProfile = profileId;
            this.saveStorage();
            
            return true;
        } catch (error) {
            console.error('切换账户失败:', error);
            vscode.window.showErrorMessage(`切换账户失败: ${error}`);
            return false;
        }
    }

    /**
     * 删除账户配置
     * @param profileId 账户ID
     * @returns 是否删除成功
     */
    deleteProfile(profileId: string): boolean {
        const index = this.storageData.profiles.findIndex(p => p.id === profileId);
        if (index === -1) {
            return false;
        }
        
        const profile = this.storageData.profiles[index];
        
        // 删除配置目录
        removeDir(profile.profilePath);
        
        // 从列表中移除
        this.storageData.profiles.splice(index, 1);
        
        // 如果删除的是当前账户，清空当前账户
        if (this.storageData.currentProfile === profileId) {
            this.storageData.currentProfile = '';
        }
        
        this.saveStorage();
        return true;
    }

    /**
     * 导出账户配置到指定目录
     * @param profileId 账户ID
     * @param targetPath 目标目录路径
     * @returns 是否导出成功
     */
    exportProfile(profileId: string, targetPath: string): boolean {
        const profile = this.storageData.profiles.find(p => p.id === profileId);
        if (!profile) {
            return false;
        }
        
        try {
            copyDir(profile.profilePath, targetPath);
            return true;
        } catch (error) {
            console.error('导出账户失败:', error);
            return false;
        }
    }
}

// ============================================================================
// Webview Provider - 侧边栏界面
// ============================================================================

/**
 * SidebarProvider - 侧边栏 Webview 提供者
 * 负责渲染和管理侧边栏界面
 */
class SidebarProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private profileManager: ProfileManager;

    constructor(
        private readonly extensionUri: vscode.Uri,
        profileManager: ProfileManager
    ) {
        this.profileManager = profileManager;
    }

    /**
     * 解析 Webview 视图
     */
    resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void {
        this._view = webviewView;
        
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };
        
        webviewView.webview.html = this.getHtmlContent();
        
        // 处理来自 Webview 的消息
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'getProfiles':
                    this.sendProfiles();
                    break;
                    
                case 'saveProfile':
                    await this.handleSaveProfile(message.name, message.email);
                    break;
                    
                case 'switchProfile':
                    await this.handleSwitchProfile(message.profileId);
                    break;
                    
                case 'deleteProfile':
                    await this.handleDeleteProfile(message.profileId);
                    break;
                    
                case 'importProfile':
                    await this.handleImportProfile();
                    break;
                    
                case 'exportProfile':
                    await this.handleExportProfile(message.profileId);
                    break;
            }
        });
    }

    /**
     * 发送账户列表到 Webview
     */
    private sendProfiles(): void {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'profiles',
                profiles: this.profileManager.getProfiles(),
                currentProfile: this.profileManager.getCurrentProfileId()
            });
        }
    }

    /**
     * 处理保存账户
     */
    private async handleSaveProfile(name: string, email: string): Promise<void> {
        try {
            this.profileManager.saveCurrentProfile(name, email);
            vscode.window.showInformationMessage(`账户 "${name}" 保存成功！`);
            this.sendProfiles();
        } catch (error) {
            vscode.window.showErrorMessage(`保存账户失败: ${error}`);
        }
    }

    /**
     * 处理切换账户
     */
    private async handleSwitchProfile(profileId: string): Promise<void> {
        const profile = this.profileManager.getProfiles().find(p => p.id === profileId);
        if (!profile) {
            return;
        }
        
        const confirm = await vscode.window.showWarningMessage(
            `确定要切换到账户 "${profile.name}" 吗？\n切换后需要重启 Windsurf 才能生效。`,
            '确定切换',
            '取消'
        );
        
        if (confirm === '确定切换') {
            const success = this.profileManager.switchProfile(profileId);
            if (success) {
                const restart = await vscode.window.showInformationMessage(
                    `已切换到账户 "${profile.name}"，需要重启 Windsurf 才能生效。`,
                    '立即重启',
                    '稍后重启'
                );
                
                if (restart === '立即重启') {
                    vscode.commands.executeCommand('workbench.action.reloadWindow');
                }
                
                this.sendProfiles();
            }
        }
    }

    /**
     * 处理删除账户
     */
    private async handleDeleteProfile(profileId: string): Promise<void> {
        const profile = this.profileManager.getProfiles().find(p => p.id === profileId);
        if (!profile) {
            return;
        }
        
        const confirm = await vscode.window.showWarningMessage(
            `确定要删除账户 "${profile.name}" 吗？此操作不可撤销。`,
            '确定删除',
            '取消'
        );
        
        if (confirm === '确定删除') {
            const success = this.profileManager.deleteProfile(profileId);
            if (success) {
                vscode.window.showInformationMessage(`账户 "${profile.name}" 已删除。`);
                this.sendProfiles();
            }
        }
    }

    /**
     * 处理导入账户
     */
    private async handleImportProfile(): Promise<void> {
        const result = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            title: '选择要导入的账户配置目录'
        });
        
        if (result && result.length > 0) {
            const profile = this.profileManager.importProfile(result[0].fsPath);
            if (profile) {
                vscode.window.showInformationMessage(`账户 "${profile.name}" 导入成功！`);
                this.sendProfiles();
            } else {
                vscode.window.showErrorMessage('导入账户失败');
            }
        }
    }

    /**
     * 处理导出账户
     */
    private async handleExportProfile(profileId: string): Promise<void> {
        const profile = this.profileManager.getProfiles().find(p => p.id === profileId);
        if (!profile) {
            return;
        }
        
        const result = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            title: '选择导出目标目录'
        });
        
        if (result && result.length > 0) {
            const targetPath = path.join(result[0].fsPath, `windsurf-profile-${profile.name}`);
            const success = this.profileManager.exportProfile(profileId, targetPath);
            if (success) {
                vscode.window.showInformationMessage(`账户已导出到: ${targetPath}`);
            } else {
                vscode.window.showErrorMessage('导出账户失败');
            }
        }
    }

    /**
     * 刷新界面
     */
    refresh(): void {
        this.sendProfiles();
    }

    /**
     * 获取 HTML 内容
     */
    private getHtmlContent(): string {
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Windsurf 账户切换</title>
    <style>
        /* ================================================================ */
        /* 基础样式                                                          */
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
        /* 标题区域                                                          */
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
        /* 操作按钮区域                                                       */
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
        /* 账户列表                                                          */
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
        /* 保存表单                                                          */
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
        /* 空状态                                                            */
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
        /* 提示信息                                                          */
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
    <!-- 头部区域                                                          -->
    <!-- ================================================================ -->
    <div class="header">
        <h2>🔄 Windsurf 账户切换</h2>
        <p>无心跳检测 · 无自动下线 · 完全本地化</p>
    </div>
    
    <!-- ================================================================ -->
    <!-- 操作按钮                                                          -->
    <!-- ================================================================ -->
    <div class="actions">
        <button class="btn btn-primary" onclick="showSaveForm()">
            💾 保存当前账户
        </button>
        <button class="btn btn-secondary" onclick="importProfile()">
            📥 导入配置
        </button>
    </div>
    
    <!-- ================================================================ -->
    <!-- 保存表单                                                          -->
    <!-- ================================================================ -->
    <div class="save-form" id="saveForm">
        <h3>保存当前账户</h3>
        <div class="form-group">
            <label for="profileName">账户名称</label>
            <input type="text" id="profileName" placeholder="例如：工作账户">
        </div>
        <div class="form-group">
            <label for="profileEmail">邮箱</label>
            <input type="email" id="profileEmail" placeholder="例如：example@email.com">
        </div>
        <div class="form-actions">
            <button class="btn btn-secondary" onclick="hideSaveForm()">取消</button>
            <button class="btn btn-primary" onclick="saveProfile()">保存</button>
        </div>
    </div>
    
    <!-- ================================================================ -->
    <!-- 账户列表                                                          -->
    <!-- ================================================================ -->
    <div class="profile-list" id="profileList">
        <div class="empty-state">
            <p>暂无保存的账户</p>
            <p>点击「保存当前账户」开始使用</p>
        </div>
    </div>
    
    <!-- ================================================================ -->
    <!-- 提示信息                                                          -->
    <!-- ================================================================ -->
    <div class="tip">
        💡 提示：切换账户后需要重启 Windsurf 才能生效
    </div>
    
    <!-- ================================================================ -->
    <!-- JavaScript 逻辑                                                   -->
    <!-- ================================================================ -->
    <script>
        // VSCode API 对象
        const vscode = acquireVsCodeApi();
        
        // 当前账户列表
        let profiles = [];
        let currentProfileId = '';
        
        // ============================================================
        // 初始化
        // ============================================================
        window.addEventListener('load', () => {
            // 请求账户列表
            vscode.postMessage({ type: 'getProfiles' });
        });
        
        // ============================================================
        // 消息处理
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
        // 渲染账户列表
        // ============================================================
        function renderProfiles() {
            const container = document.getElementById('profileList');
            
            if (profiles.length === 0) {
                container.innerHTML = \`
                    <div class="empty-state">
                        <p>暂无保存的账户</p>
                        <p>点击「保存当前账户」开始使用</p>
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
                            <div class="time">保存于: \${escapeHtml(profile.savedAt)}</div>
                        </div>
                        \${profile.id === currentProfileId ? '<span class="profile-badge">当前</span>' : ''}
                    </div>
                    <div class="profile-actions">
                        \${profile.id !== currentProfileId ? 
                            \`<button class="btn btn-primary" onclick="switchProfile('\${profile.id}')">切换</button>\` : 
                            ''
                        }
                        <button class="btn btn-secondary" onclick="exportProfile('\${profile.id}')">导出</button>
                        <button class="btn btn-danger" onclick="deleteProfile('\${profile.id}')">删除</button>
                    </div>
                </div>
            \`).join('');
        }
        
        // ============================================================
        // 显示/隐藏保存表单
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
        // 保存账户
        // ============================================================
        function saveProfile() {
            const name = document.getElementById('profileName').value.trim();
            const email = document.getElementById('profileEmail').value.trim();
            
            if (!name) {
                alert('请输入账户名称');
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
        // 切换账户
        // ============================================================
        function switchProfile(profileId) {
            vscode.postMessage({
                type: 'switchProfile',
                profileId: profileId
            });
        }
        
        // ============================================================
        // 删除账户
        // ============================================================
        function deleteProfile(profileId) {
            vscode.postMessage({
                type: 'deleteProfile',
                profileId: profileId
            });
        }
        
        // ============================================================
        // 导入账户
        // ============================================================
        function importProfile() {
            vscode.postMessage({ type: 'importProfile' });
        }
        
        // ============================================================
        // 导出账户
        // ============================================================
        function exportProfile(profileId) {
            vscode.postMessage({
                type: 'exportProfile',
                profileId: profileId
            });
        }
        
        // ============================================================
        // HTML 转义
        // ============================================================
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    </script>
</body>
</html>`;
    }
}

// ============================================================================
// 插件激活入口
// ============================================================================

/**
 * 插件激活函数
 * 在 Windsurf 启动时被调用
 */
export function activate(context: vscode.ExtensionContext): void {
    console.log('Windsurf Switcher Free 已激活');
    
    // 创建配置管理器
    const profileManager = new ProfileManager();
    
    // 创建侧边栏 Provider
    const sidebarProvider = new SidebarProvider(context.extensionUri, profileManager);
    
    // 注册 Webview Provider
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'windsurfSwitcherFree.view',
            sidebarProvider
        )
    );
    
    // 注册刷新命令
    context.subscriptions.push(
        vscode.commands.registerCommand('windsurfSwitcherFree.refresh', () => {
            sidebarProvider.refresh();
        })
    );
    
    // 注册导入命令
    context.subscriptions.push(
        vscode.commands.registerCommand('windsurfSwitcherFree.importProfile', async () => {
            const result = await vscode.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                title: '选择要导入的账户配置目录'
            });
            
            if (result && result.length > 0) {
                const profile = profileManager.importProfile(result[0].fsPath);
                if (profile) {
                    vscode.window.showInformationMessage(`账户 "${profile.name}" 导入成功！`);
                    sidebarProvider.refresh();
                }
            }
        })
    );
    
    // 显示欢迎消息
    vscode.window.showInformationMessage(
        'Windsurf Switcher Free 已启动 - 无心跳检测，无自动下线'
    );
}

/**
 * 插件停用函数
 */
export function deactivate(): void {
    console.log('Windsurf Switcher Free 已停用');
}
