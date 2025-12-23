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
                    
                case 'openProfilesDir':
                    await this.handleOpenProfilesDir();
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
     * 处理打开配置目录
     */
    private async handleOpenProfilesDir(): Promise<void> {
        const profilesDir = path.join(PLUGIN_DATA_PATH, 'profiles');
        ensureDir(profilesDir);
        
        // 使用 vscode 打开目录
        const uri = vscode.Uri.file(profilesDir);
        await vscode.commands.executeCommand('revealFileInOS', uri);
        vscode.window.showInformationMessage(`配置目录: ${profilesDir}`);
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
        /* 基础样式 - 现代化设计                                              */
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
        /* 头部区域 - 渐变背景                                                */
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
        /* 操作按钮区域 - 卡片式布局                                          */
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
        /* 账户列表 - 卡片设计                                                */
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
        /* 保存表单 - 弹出式设计                                              */
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
        /* 空状态 - 引导设计                                                  */
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
        /* 提示信息                                                          */
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
        /* 作者水印区域                                                       */
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
    </style>
</head>
<body>
    <!-- ================================================================ -->
    <!-- 头部区域                                                          -->
    <!-- ================================================================ -->
    <div class="header">
        <h2>🔄 Windsurf 账户切换器</h2>
        <p>无限畅享 · 自由切换 · 完全免费</p>
        <div class="feature-tags">
            <span class="tag">✨ 无心跳检测</span>
            <span class="tag">🔒 无自动下线</span>
            <span class="tag">💾 本地存储</span>
        </div>
    </div>
    
    <!-- ================================================================ -->
    <!-- 操作按钮                                                          -->
    <!-- ================================================================ -->
    <div class="actions">
        <button class="btn btn-primary btn-full" onclick="showSaveForm()">
            💾 保存当前账户
        </button>
        <button class="btn btn-secondary" onclick="importProfile()">
            📥 导入
        </button>
        <button class="btn btn-secondary" onclick="openProfilesDir()">
            📂 目录
        </button>
    </div>
    
    <!-- ================================================================ -->
    <!-- 保存表单                                                          -->
    <!-- ================================================================ -->
    <div class="save-form" id="saveForm">
        <h3>💾 保存当前账户</h3>
        <div class="form-group">
            <label>账户名称</label>
            <input type="text" id="profileName" placeholder="输入一个便于识别的名称">
        </div>
        <div class="form-group">
            <label>邮箱地址</label>
            <input type="email" id="profileEmail" placeholder="your@email.com">
        </div>
        <div class="form-actions">
            <button class="btn btn-secondary" onclick="hideSaveForm()">取消</button>
            <button class="btn btn-primary" onclick="saveProfile()">确认保存</button>
        </div>
    </div>
    
    <!-- ================================================================ -->
    <!-- 账户列表                                                          -->
    <!-- ================================================================ -->
    <div class="section-title">📋 已保存的账户</div>
    <div class="profile-list" id="profileList">
        <div class="empty-state">
            <div class="icon">📭</div>
            <h4>暂无保存的账户</h4>
            <p>点击上方「保存当前账户」按钮<br>开始管理你的 Windsurf 账户</p>
        </div>
    </div>
    
    <!-- ================================================================ -->
    <!-- 提示信息                                                          -->
    <!-- ================================================================ -->
    <div class="tip">
        💡 <strong>提示：</strong>切换账户后需要重启 Windsurf 才能生效
    </div>
    
    <!-- ================================================================ -->
    <!-- 作者水印                                                          -->
    <!-- ================================================================ -->
    <div class="author-watermark">
        <div class="author-title">✨ 开发者 ✨</div>
        <div class="author-name">万能程序员：传康KK</div>
        <div class="author-links">
            <span>📱 微信：1837620622</span>
            <span>📧 邮箱：2040168455@qq.com</span>
            <span>🎬 咸鱼/B站：万能程序员</span>
        </div>
        <a class="github-link" href="https://github.com/1837620622" target="_blank">
            ⭐ GitHub: github.com/1837620622
        </a>
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
                        <div class="icon">📭</div>
                        <h4>暂无保存的账户</h4>
                        <p>点击上方「保存当前账户」按钮<br>开始管理你的 Windsurf 账户</p>
                    </div>
                \`;
                return;
            }
            
            container.innerHTML = profiles.map(profile => \`
                <div class="profile-item \${profile.id === currentProfileId ? 'active' : ''}">
                    <div class="profile-header">
                        <div class="profile-info">
                            <h3>👤 \${escapeHtml(profile.name)}</h3>
                            <div class="email">📧 \${escapeHtml(profile.email)}</div>
                            <div class="time">🕐 \${escapeHtml(profile.savedAt)}</div>
                        </div>
                        \${profile.id === currentProfileId ? '<span class="profile-badge">✓ 当前</span>' : ''}
                    </div>
                    <div class="profile-actions">
                        \${profile.id !== currentProfileId ? 
                            \`<button class="btn btn-success" onclick="switchProfile('\${profile.id}')">🔄 切换</button>\` : 
                            '<button class="btn btn-secondary" disabled>✓ 已激活</button>'
                        }
                        <button class="btn btn-secondary" onclick="exportProfile('\${profile.id}')">📤 导出</button>
                        <button class="btn btn-danger" onclick="deleteProfile('\${profile.id}')">🗑️ 删除</button>
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
        // 打开配置目录
        // ============================================================
        function openProfilesDir() {
            vscode.postMessage({ type: 'openProfilesDir' });
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
