export type StagingPortalProject = {
    id: string;
    version: string;
    build: string;
    href: string;
    variant?: 'primary' | 'secondary' | 'qr';
    qrData?: string;
};
export type StagingPortalTexts = {
    languageNames: Record<string, string>;
    badge: string;
    title: string;
    subtitle: string;
    loginTitle: string;
    usernamePlaceholder: string;
    passwordPlaceholder: string;
    checking: string;
    enter: string;
    wrongCredentials: string;
    verifyError: string;
    secureUnavailable: string;
    languageLabel: string;
    version: (version: string, build: string) => string;
    projects: Record<string, {
        title: string;
        text: string;
        actionLabel: string;
        qrLabel?: string;
    }>;
};
export type StagingPortalTheme = {
    background?: string;
    surface?: string;
    text?: string;
    mutedText?: string;
    border?: string;
    primary?: string;
    primaryText?: string;
    secondary?: string;
    secondaryText?: string;
    inputBackground?: string;
    danger?: string;
};
export type StagingPortalConfig = {
    brand: string;
    organizationSlug: string;
    stage: string;
    passwordSha256ByStage: Record<string, string>;
    accessStorageKey: string;
    languageStorageKey: string;
    supportedLanguageCodes: readonly string[];
    defaultLanguageCode?: string;
    textsByLanguage: Record<string, StagingPortalTexts>;
    projects: readonly StagingPortalProject[];
    theme?: StagingPortalTheme;
};
export declare function StagingPortal({ config }: {
    config: StagingPortalConfig;
}): import("react/jsx-runtime").JSX.Element;
export declare function stagingUsername(config: Pick<StagingPortalConfig, 'organizationSlug'>): string;
export declare function stagingPasswordSha256(config: Pick<StagingPortalConfig, 'passwordSha256ByStage' | 'stage'>): string;
export declare function hasStagingAccess(config: StagingPortalConfig): boolean;
export declare function readPreferredLanguageCode(config: StagingPortalConfig): string;
export declare function writePreferredLanguageCode(config: StagingPortalConfig, languageCode: string): void;
