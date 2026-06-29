import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

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
  projects: Record<
    string,
    {
      title: string;
      text: string;
      actionLabel: string;
      qrLabel?: string;
    }
  >;
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
  username: string;
  passwordSha256: string;
  accessStorageKey: string;
  languageStorageKey: string;
  supportedLanguageCodes: readonly string[];
  defaultLanguageCode?: string;
  textsByLanguage: Record<string, StagingPortalTexts>;
  projects: readonly StagingPortalProject[];
  theme?: StagingPortalTheme;
};

const defaultTheme = {
  background: '#f7f4ec',
  surface: '#ffffff',
  text: '#17131f',
  mutedText: '#5f5769',
  border: '#ddd5e7',
  primary: '#b800ff',
  primaryText: '#16091d',
  secondary: '#17131f',
  secondaryText: '#ffffff',
  inputBackground: '#f4f0fa',
  danger: '#d72655',
} satisfies Required<StagingPortalTheme>;

export function StagingPortal({ config }: { config: StagingPortalConfig }) {
  const theme = { ...defaultTheme, ...(config.theme || {}) };
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { width } = useWindowDimensions();
  const compact = width < 720;
  const [languageCode, setLanguageCode] = useState(() => readPreferredLanguageCode(config));
  const text = textsForLanguage(config, languageCode);
  const [accessGranted, setAccessGranted] = useState(() => readStagingAccess(config));
  const [username, setUsername] = useState(config.username);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function unlock() {
    if (submitting) return;
    setSubmitting(true);

    let passwordHash = '';
    try {
      passwordHash = await sha256(password);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : text.verifyError);
      setSubmitting(false);
      return;
    }

    const isUsernameValid = username.trim().toLowerCase() === config.username.trim().toLowerCase();
    const isPasswordValid = passwordHash === config.passwordSha256;
    if (!isUsernameValid || !isPasswordValid) {
      setMessage(text.wrongCredentials);
      setSubmitting(false);
      return;
    }

    globalThis.localStorage?.setItem(config.accessStorageKey, 'ok');
    setAccessGranted(true);
    setPassword('');
    setMessage(null);
    setSubmitting(false);
  }

  function openPath(path: string) {
    globalThis.location.assign(path);
  }

  function selectLanguage(nextLanguageCode: string) {
    writePreferredLanguageCode(config, nextLanguageCode);
    setLanguageCode(readPreferredLanguageCode(config));
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={[styles.scrollContent, compact ? styles.scrollContentCompact : null]} keyboardShouldPersistTaps="handled">
        <View style={[styles.shell, compact ? styles.shellCompact : null]}>
          <View style={[styles.header, compact ? styles.headerCompact : null]}>
            <Text style={styles.brand}>{config.brand}</Text>
            <View style={[styles.headerActions, compact ? styles.headerActionsCompact : null]}>
              <View accessibilityLabel={text.languageLabel} style={styles.languageToggle}>
                {config.supportedLanguageCodes.map((code) => {
                  const active = languageCode === code;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      key={code}
                      onPress={() => selectLanguage(code)}
                      style={[styles.languageButton, active ? styles.languageButtonActive : null]}
                    >
                      <Text style={[styles.languageButtonText, active ? styles.languageButtonTextActive : null]}>
                        {text.languageNames[code] || code}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.badge}>{text.badge}</Text>
            </View>
          </View>

          <View style={[styles.hero, compact ? styles.heroCompact : null]}>
            <Text style={[styles.title, compact ? styles.titleCompact : null]}>{text.title}</Text>
            <Text style={[styles.subtitle, compact ? styles.subtitleCompact : null]}>{text.subtitle}</Text>
          </View>

          {accessGranted ? (
            <View style={[styles.grid, compact ? styles.gridCompact : null]}>
              {config.projects.map((project) => (
                <ProjectCard
                  compact={compact}
                  key={project.id}
                  onOpen={() => openPath(project.href)}
                  project={project}
                  styles={styles}
                  text={text}
                />
              ))}
            </View>
          ) : (
            <View style={styles.loginPanel}>
              <Text style={styles.panelTitle}>{text.loginTitle}</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="username"
                onChangeText={setUsername}
                placeholder={text.usernamePlaceholder}
                placeholderTextColor="#7f748c"
                style={styles.input}
                textContentType="username"
                value={username}
              />
              <TextInput
                autoCapitalize="none"
                autoComplete="current-password"
                onChangeText={setPassword}
                onSubmitEditing={() => void unlock()}
                placeholder={text.passwordPlaceholder}
                placeholderTextColor="#7f748c"
                secureTextEntry
                style={styles.input}
                textContentType="password"
                value={password}
              />
              {message ? <Text style={styles.errorText}>{message}</Text> : null}
              <Pressable accessibilityRole="button" disabled={submitting} onPress={() => void unlock()} style={[styles.primaryButton, submitting ? styles.disabledButton : null]}>
                <Text style={styles.primaryButtonText}>{submitting ? text.checking : text.enter}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProjectCard({
  compact,
  onOpen,
  project,
  styles,
  text,
}: {
  compact: boolean;
  onOpen: () => void;
  project: StagingPortalProject;
  styles: ReturnType<typeof createStyles>;
  text: StagingPortalTexts;
}) {
  const copy = text.projects[project.id];
  if (!copy) return null;
  const variant = project.variant || 'secondary';
  const qrData = project.qrData || project.href;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=12&data=${encodeURIComponent(qrData)}`;

  if (variant === 'qr') {
    return (
      <View style={[styles.qrPanel, compact ? styles.qrPanelCompact : null]}>
        <View style={styles.qrCopy}>
          <Text style={styles.panelTitle}>{copy.title}</Text>
          <VersionText build={project.build} version={project.version} versionText={text.version} styles={styles} />
          <Text style={styles.panelText}>{copy.text}</Text>
          <Text selectable style={[styles.codeText, compact ? styles.codeTextCompact : null]}>{qrData}</Text>
          <Pressable accessibilityRole="link" onPress={onOpen} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>{copy.actionLabel}</Text>
          </Pressable>
        </View>
        <Image accessibilityLabel={copy.qrLabel || copy.title} source={{ uri: qrUrl }} style={[styles.qr, compact ? styles.qrCompact : null]} />
      </View>
    );
  }

  const buttonStyle = variant === 'primary' ? styles.primaryButton : styles.secondaryButton;
  const buttonTextStyle = variant === 'primary' ? styles.primaryButtonText : styles.secondaryButtonText;
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{copy.title}</Text>
      <VersionText build={project.build} version={project.version} versionText={text.version} styles={styles} />
      <Text style={styles.panelText}>{copy.text}</Text>
      <Pressable accessibilityRole={project.href.startsWith('/') ? 'button' : 'link'} onPress={onOpen} style={buttonStyle}>
        <Text style={buttonTextStyle}>{copy.actionLabel}</Text>
      </Pressable>
    </View>
  );
}

function VersionText({
  build,
  styles,
  version,
  versionText,
}: {
  build: string;
  styles: ReturnType<typeof createStyles>;
  version: string;
  versionText: (version: string, build: string) => string;
}) {
  const shortBuild = build.length > 12 ? build.slice(0, 12) : build;
  return <Text selectable style={styles.versionText}>{versionText(version, shortBuild)}</Text>;
}

export function hasStagingAccess(config: StagingPortalConfig) {
  return readStagingAccess(config);
}

function readStagingAccess(config: StagingPortalConfig) {
  return globalThis.localStorage?.getItem(config.accessStorageKey) === 'ok';
}

export function readPreferredLanguageCode(config: StagingPortalConfig) {
  return normalizeLanguageCode(config, globalThis.localStorage?.getItem(config.languageStorageKey) ?? detectLocalLanguageCode());
}

export function writePreferredLanguageCode(config: StagingPortalConfig, languageCode: string) {
  globalThis.localStorage?.setItem(config.languageStorageKey, normalizeLanguageCode(config, languageCode));
}

function textsForLanguage(config: StagingPortalConfig, languageCode: string) {
  return config.textsByLanguage[normalizeLanguageCode(config, languageCode)] || config.textsByLanguage[config.defaultLanguageCode || 'en'];
}

function normalizeLanguageCode(config: StagingPortalConfig, value: string | null | undefined) {
  const fallback = config.defaultLanguageCode || config.supportedLanguageCodes[0] || 'en';
  return config.supportedLanguageCodes.includes(String(value || '')) ? String(value) : fallback;
}

function detectLocalLanguageCode() {
  const nav = typeof navigator === 'undefined' ? undefined : navigator;
  const languages = Array.isArray(nav?.languages) ? nav.languages : [];
  const language = typeof nav?.language === 'string' ? [nav.language] : [];
  const intlLocale = Intl.DateTimeFormat().resolvedOptions().locale;
  return [...languages, ...language, intlLocale]
    .filter((value): value is string => Boolean(value))
    .map((locale) => locale.toLowerCase().split(/[-_]/)[0])[0];
}

async function sha256(value: string) {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Secure password verification is not available in this browser.');
  }
  const bytes = new TextEncoder().encode(value);
  const hash = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function createStyles(theme: Required<StagingPortalTheme>) {
  return StyleSheet.create({
    root: {
      backgroundColor: theme.background,
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    scrollContentCompact: {
      paddingBottom: 24,
    },
    shell: {
      alignSelf: 'center',
      gap: 22,
      maxWidth: 980,
      paddingHorizontal: 22,
      paddingVertical: 26,
      width: '100%',
    },
    shellCompact: {
      gap: 16,
      paddingHorizontal: 14,
      paddingVertical: 16,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
    },
    headerCompact: {
      alignItems: 'flex-start',
      flexDirection: 'column',
    },
    headerActions: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      justifyContent: 'flex-end',
    },
    headerActionsCompact: {
      justifyContent: 'flex-start',
      width: '100%',
    },
    brand: {
      color: theme.text,
      fontSize: 38,
      fontWeight: '900',
    },
    badge: {
      backgroundColor: theme.secondary,
      borderRadius: 8,
      color: theme.secondaryText,
      fontSize: 13,
      fontWeight: '900',
      overflow: 'hidden',
      paddingHorizontal: 12,
      paddingVertical: 8,
      textTransform: 'uppercase',
    },
    languageToggle: {
      backgroundColor: theme.surface,
      borderColor: theme.border,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: 'row',
      overflow: 'hidden',
    },
    languageButton: {
      justifyContent: 'center',
      minHeight: 38,
      paddingHorizontal: 12,
    },
    languageButtonActive: {
      backgroundColor: theme.secondary,
    },
    languageButtonText: {
      color: theme.mutedText,
      fontSize: 13,
      fontWeight: '900',
    },
    languageButtonTextActive: {
      color: theme.secondaryText,
    },
    hero: {
      gap: 8,
      maxWidth: 680,
    },
    heroCompact: {
      maxWidth: '100%',
    },
    title: {
      color: theme.text,
      fontSize: 48,
      fontWeight: '900',
      lineHeight: 54,
    },
    titleCompact: {
      fontSize: 34,
      lineHeight: 39,
    },
    subtitle: {
      color: theme.mutedText,
      fontSize: 20,
      fontWeight: '800',
      lineHeight: 27,
    },
    subtitleCompact: {
      fontSize: 16,
      lineHeight: 22,
    },
    grid: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 14,
    },
    gridCompact: {
      flexDirection: 'column',
      flexWrap: 'nowrap',
    },
    panel: {
      backgroundColor: theme.surface,
      borderColor: theme.border,
      borderRadius: 8,
      borderWidth: 1,
      flexBasis: 260,
      flexGrow: 1,
      gap: 14,
      padding: 18,
    },
    qrPanel: {
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderColor: theme.border,
      borderRadius: 8,
      borderWidth: 1,
      flexBasis: 420,
      flexDirection: 'row',
      flexGrow: 1,
      gap: 16,
      justifyContent: 'space-between',
      padding: 18,
    },
    qrPanelCompact: {
      alignItems: 'stretch',
      flexBasis: 'auto',
      flexDirection: 'column',
    },
    qrCopy: {
      flex: 1,
      gap: 10,
      minWidth: 190,
    },
    loginPanel: {
      backgroundColor: theme.surface,
      borderColor: theme.border,
      borderRadius: 8,
      borderWidth: 1,
      gap: 14,
      maxWidth: 430,
      padding: 18,
      width: '100%',
    },
    panelTitle: {
      color: theme.text,
      fontSize: 22,
      fontWeight: '900',
    },
    panelText: {
      color: theme.mutedText,
      fontSize: 15,
      fontWeight: '800',
      lineHeight: 21,
    },
    versionText: {
      color: '#7f748c',
      fontSize: 13,
      fontWeight: '900',
    },
    input: {
      backgroundColor: theme.inputBackground,
      borderColor: theme.border,
      borderRadius: 8,
      borderWidth: 1,
      color: theme.text,
      fontSize: 18,
      minHeight: 58,
      paddingHorizontal: 16,
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: theme.primary,
      borderRadius: 8,
      justifyContent: 'center',
      minHeight: 56,
      paddingHorizontal: 18,
    },
    primaryButtonText: {
      color: theme.primaryText,
      fontSize: 16,
      fontWeight: '900',
    },
    disabledButton: {
      opacity: 0.45,
    },
    secondaryButton: {
      alignItems: 'center',
      backgroundColor: theme.secondary,
      borderRadius: 8,
      justifyContent: 'center',
      minHeight: 56,
      paddingHorizontal: 18,
    },
    secondaryButtonText: {
      color: theme.secondaryText,
      fontSize: 16,
      fontWeight: '900',
    },
    codeText: {
      backgroundColor: theme.inputBackground,
      borderColor: theme.border,
      borderRadius: 8,
      borderWidth: 1,
      color: theme.text,
      fontSize: 13,
      fontWeight: '900',
      padding: 10,
    },
    codeTextCompact: {
      fontSize: 11,
    },
    qr: {
      backgroundColor: theme.surface,
      borderRadius: 8,
      height: 190,
      width: 190,
    },
    qrCompact: {
      alignSelf: 'center',
      height: 160,
      width: 160,
    },
    errorText: {
      color: theme.danger,
      fontSize: 14,
      fontWeight: '900',
    },
  });
}
