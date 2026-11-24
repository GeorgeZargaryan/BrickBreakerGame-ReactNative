import { afterEach, beforeEach, expect, it, jest } from "@jest/globals";
import { act } from "react";
import { create, type ReactTestRenderer } from "react-test-renderer";
import { Image, KeyboardAvoidingView, Modal, ScrollView } from "react-native";
import MainMenu from "../../app/index";
import PlayerProfileScreen from "../../app/personal-best";
import { FriendsPanel } from "../profile/FriendsPanel";
import type { SocialPlayer } from "../../services/friendsApi";

const mockPush = jest.fn();
const mockGetOnlineProfile = jest.fn<() => Promise<unknown>>();
const mockFindPlayers = jest.fn<(nickname: string, query: string, signal?: AbortSignal) => Promise<SocialPlayer[]>>();

jest.mock("react-native", () => {
    return {
        View: "View", Text: "Text", TextInput: "TextInput", Pressable: "Pressable",
        Image: "Image", KeyboardAvoidingView: "KeyboardAvoidingView", Modal: "Modal", ScrollView: "ScrollView",
        StyleSheet: { create: (styles: unknown) => styles, hairlineWidth: 1 },
        Platform: { OS: "ios" },
        TurboModuleRegistry: { get: () => null },
        Keyboard: { dismiss: jest.fn(), addListener: () => ({ remove: jest.fn() }) },
    };
});
jest.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 20, bottom: 10 }) }));
jest.mock("expo-router", () => {
    const React = jest.requireActual<typeof import("react")>("react");
    return {
        useRouter: () => ({ push: mockPush, back: jest.fn() }),
        useFocusEffect: (callback: () => void) => React.useEffect(callback, [callback]),
    };
});
jest.mock("react-native-reanimated", () => ({ configureReanimatedLogger: jest.fn(), ReanimatedLogLevel: { warn: 1 } }));
jest.mock("../menu/LiveMenuBackground", () => ({ LiveMenuBackground: () => null }));
jest.mock("../../context/ThemeContext", () => ({
    useTheme: () => ({
        theme: { background: "#111111", text: "#ffffff", border: "#555555", paddle: "#ffcc00", ball: "#dddddd", bricks: ["#eeeeee"] },
    }),
}));
jest.mock("../../context/PlayerNameContext", () => ({
    usePlayerName: () => ({ playerName: "Player", setPlayerName: jest.fn(), isLoading: false }),
}));
jest.mock("../../services/leaderboardApi", () => ({ API_BASE: "http://localhost:5000" }));
jest.mock("../../services/localStats", () => ({ getPersonalBest: async () => null }));
jest.mock("../../services/playerProfile", () => ({
    getOnlineProfile: () => mockGetOnlineProfile(),
}));
jest.mock("../../services/friendsApi", () => ({
    getFriends: async () => [],
    findPlayers: (...args: Parameters<typeof mockFindPlayers>) => mockFindPlayers(...args),
}));

const reactEnvironment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
let renderer: ReactTestRenderer | undefined;

beforeEach(() => {
    reactEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
    mockPush.mockClear();
    mockFindPlayers.mockReset();
    mockGetOnlineProfile.mockReset().mockResolvedValue({ id: "test-profile", nickname: "Player", runsPlayed: 0, recentRuns: [] });
    const report = console.error;
    jest.spyOn(console, "error").mockImplementation((message, ...args) => {
        if (!String(message).includes("react-test-renderer is deprecated")) report(message, ...args);
    });
});

afterEach(() => {
    act(() => renderer?.unmount());
    renderer = undefined;
    delete reactEnvironment.IS_REACT_ACT_ENVIRONMENT;
    jest.useRealTimers();
    jest.restoreAllMocks();
});

it("uses a fixed-size image with room inside the Settings button", () => {
    act(() => { renderer = create(<MainMenu />); });
    const button = renderer!.root.findAllByProps({ accessibilityLabel: "Settings", accessibilityRole: "button" })[0];
    expect(button).toBeDefined();
    const image = button.findByType(Image);
    expect(image.props.resizeMode).toBe("contain");
    const [iconStyle] = image.props.style;
    const [buttonStyle] = button.props.style({ pressed: false });
    expect(iconStyle).toMatchObject({ width: 22, height: 22 });
    expect(buttonStyle).toMatchObject({ width: 44, height: 44 });
    act(() => button.props.onPress());
    expect(mockPush).toHaveBeenCalledWith("/settings");
});

it("shows Friends while the online profile is still loading", async () => {
    mockGetOnlineProfile.mockImplementation(() => new Promise(() => {}));
    await act(async () => { renderer = create(<PlayerProfileScreen />); });

    const friends = renderer!.root.findByType(FriendsPanel);
    const button = friends.findAllByProps({ accessibilityLabel: "Find people" })[0];
    expect(button).toBeDefined();
    expect(button.props.disabled).toBe(false);
});

it("holds the people search input above the scrollable results", async () => {
    await act(async () => { renderer = create(<PlayerProfileScreen />); });
    const friends = renderer!.root.findByType(FriendsPanel);
    const button = friends.findAllByProps({ accessibilityLabel: "Find people" })[0];
    expect(button).toBeDefined();
    act(() => button.props.onPress());

    const modal = friends.findByType(Modal);
    expect(modal.props.visible).toBe(true);
    const layout = modal.findByType(KeyboardAvoidingView);
    expect(layout.props.behavior).toBe("padding");
    expect(layout.findAllByProps({ accessibilityLabel: "Search by nickname" })).toHaveLength(1);
    expect(layout.findByType(ScrollView).findAllByProps({ accessibilityLabel: "Search by nickname" })).toHaveLength(0);

    const done = modal.findAllByProps({ accessibilityLabel: "Done" })[0];
    act(() => done.props.onPress());
    expect(friends.findAllByType(Modal)).toHaveLength(0);
});

it("searches as you type after a short debounce and ignores outdated responses", async () => {
    jest.useFakeTimers();
    let finishOldSearch: ((players: SocialPlayer[]) => void) | undefined;
    mockFindPlayers
        .mockImplementationOnce(() => new Promise(resolve => { finishOldSearch = resolve; }))
        .mockResolvedValueOnce([{ id: "new", nickname: "Alina latest", relationship: "none" }]);

    await act(async () => { renderer = create(<PlayerProfileScreen />); });
    const friends = renderer!.root.findByType(FriendsPanel);
    act(() => friends.findAllByProps({ accessibilityLabel: "Find people" })[0].props.onPress());
    const input = friends.findAllByProps({ accessibilityLabel: "Search by nickname" })[0];

    act(() => input.props.onChangeText("A"));
    await act(async () => { jest.advanceTimersByTime(300); });
    expect(mockFindPlayers).not.toHaveBeenCalled();
    act(() => input.props.onChangeText("Ali"));
    await act(async () => { jest.advanceTimersByTime(249); });
    expect(mockFindPlayers).not.toHaveBeenCalled();
    await act(async () => { jest.advanceTimersByTime(1); });
    const oldSignal = mockFindPlayers.mock.calls[0]?.[2];
    expect(mockFindPlayers).toHaveBeenCalledWith("Player", "Ali", expect.objectContaining({ aborted: false }));

    act(() => input.props.onChangeText("Alina"));
    expect(oldSignal?.aborted).toBe(true);
    await act(async () => { jest.advanceTimersByTime(250); });
    expect(mockFindPlayers).toHaveBeenCalledTimes(2);
    expect(friends.findAllByProps({ children: "Alina latest" }).length).toBeGreaterThan(0);

    await act(async () => {
        finishOldSearch?.([{ id: "old", nickname: "Alice stale", relationship: "none" }]);
    });
    expect(friends.findAllByProps({ children: "Alice stale" })).toHaveLength(0);
    act(() => input.props.onChangeText("A"));
    expect(friends.findAllByProps({ children: "Alina latest" })).toHaveLength(0);
});
