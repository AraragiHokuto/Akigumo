import React, { useEffect } from 'react'
import { StyleSheet, View, TouchableOpacity, Text, Dimensions, StatusBar } from 'react-native'
import { connect, ConnectedProps } from 'react-redux'
import ViewPager from '@react-native-community/viewpager'
import Slider from '@react-native-community/slider'
import moment from 'moment'
import FastImage from 'react-native-fast-image'
import * as Progress from 'react-native-progress'
import { createImageProgress } from 'react-native-image-progress'
import Icon from 'react-native-vector-icons/MaterialIcons'

import { MainStates } from 'src/state/types'
import { ChapterMeta, ChapterInfo, PageInfo, ChapterFeeder } from 'src/MangaAPI'
import Actions from 'src/state/actions'
import FullScreen from 'src/FullScreen'
import BatteryStatus from 'src/BatteryStatus'
import { ThemeContext } from 'src/Theme'
import ViewPagerDynamic from './ViewPagerDynamic'

const ProgressImage = createImageProgress(FastImage)

interface TouchResponderProps {
    overlayVisible: boolean
    leftHand: boolean
    onPressNext: () => void
    onPressPrev: () => void
    onToggleOverlay: () => void
}

function TouchResponder(props: TouchResponderProps) {
    const styles = StyleSheet.create({
        container: {
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            flexDirection: props.leftHand ? 'row' : 'row-reverse'
        },
        touchable: {
            width: "100%",
            height: "100%",
            backgroundColor: props.overlayVisible ? "#000000cc" : "#00000000",
        },
        touchableText: {
            textAlign: "center",
            textAlignVertical: "center",
            color: "white",
            height: "100%",
            opacity: props.overlayVisible ? 1 : 0
        }
    })

    return (
        <View style={styles.container}>
            <View style={{ flex: 3, padding: 5 }}>
                <View style={styles.touchable}>
                    <TouchableOpacity onPress={props.onPressNext}>
                        <Text style={styles.touchableText}>
                            Next
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ flex: 2, padding: 5 }}>
                <View style={styles.touchable}>
                    <TouchableOpacity onPress={props.onToggleOverlay}>
                        <Text style={styles.touchableText}>
                            Show/Dismiss Overlay
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ flex: 3, padding: 5 }}>
                <View style={styles.touchable}>
                    <TouchableOpacity onPress={props.onPressPrev}>
                        <Text style={styles.touchableText}>
                            Prev
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}

interface OverlayControlsProps {
    onPressNextChapter: () => void
    onPressPrevChapter: () => void
    onPressToggleHand: () => void
    onPressToggleDoublePage: () => void
    onToggleDark: () => void
    onSetPage: (page: number) => void
    totalPages: number
    page: number
    leftHand: boolean
    doublePage: boolean
    darkMode: boolean
}

function OverlayControls(props: OverlayControlsProps) {
    return (
        <ThemeContext.Consumer>
            {theme => {
                let navbarHeight = (
                    Dimensions.get('screen').height
                    - Dimensions.get('window').height
                )

                const styles = StyleSheet.create({
                    container: {
                        position: "absolute",
                        bottom: navbarHeight,
                        left: 0,
                        right: 0,
                        height: 100,
                        backgroundColor: theme.background.color,
                        flexDirection: "column"
                    },
                    columnWrapper: {
                        flex: 1,
                        flexDirection: "row",
                        padding: 10
                    },
                    button: {
                        height: "100%",
                        flex: 1
                    },
                    buttonText: {
                        height: "100%",
                        width: "100%",
                        fontSize: 24,
                        textAlign: "center",
                        textAlignVertical: "center"
                    },
                })

                const PageSlider = (props: { page: number, total: number, style?: any, onSetPage: (page: number) => void }) => {
                    const [displayPage, setDisplayPage] = React.useState<number>(props.page)

                    const styles = StyleSheet.create({
                        wrapper: {
                            flex: 1,
                            flexDirection: "row",
                        },
                        text: {
                            color: theme.background.text,
                            width: 30,
                            textAlign: "center",
                            textAlignVertical: "center"
                        },
                        slider: {
                            height: "100%",
                            flexGrow: 1,
                        }
                    })

                    return (
                        < View style={styles.wrapper} >
                            <Text style={styles.text}>{displayPage + 1}</Text>
                            <Slider
                                style={styles.slider}
                                maximumValue={props.total - 1}
                                minimumValue={0}
                                step={1}
                                value={props.page}
                                onValueChange={setDisplayPage}
                                onSlidingComplete={props.onSetPage} />
                            <Text style={styles.text}>{props.total}</Text>
                        </View>
                    )
                }

                return (
                    <View style={styles.container}>
                        <View style={styles.columnWrapper}>
                            <View style={styles.button}>
                                <TouchableOpacity onPress={props.onPressPrevChapter}>
                                    <Icon
                                        name="fast-rewind"
                                        style={styles.buttonText}
                                        color={theme.background.text} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.button}>
                                <TouchableOpacity onPress={props.onPressToggleHand}>
                                    <Icon
                                        name={props.leftHand ? "border-left" : "border-right"}
                                        style={styles.buttonText}
                                        color={theme.background.text} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.button}>
                                <TouchableOpacity onPress={props.onToggleDark}>
                                    <Icon
                                        name={props.darkMode ? "brightness-4" : "brightness-7"}
                                        style={styles.buttonText}
                                        color={theme.background.text} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.button}>
                                <TouchableOpacity onPress={props.onPressToggleDoublePage}>
                                    <Icon
                                        name="import-contacts"
                                        style={styles.buttonText}
                                        color={props.doublePage ? theme.primary.default : theme.background.text} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.button}>
                                <TouchableOpacity onPress={props.onPressNextChapter}>
                                    <Icon
                                        name="fast-forward"
                                        style={styles.buttonText}
                                        color={theme.background.text} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.columnWrapper}>
                            <PageSlider
                                page={props.page}
                                total={props.totalPages}
                                onSetPage={props.onSetPage} />
                        </View>
                    </View >
                )
            }}
        </ThemeContext.Consumer>
    )
}

const mapStates = (state: MainStates) => ({
    feeder: state.readViewStates.feeder,
    chapter: state.readViewStates.chapter,
    pageIndex: state.readViewStates.pageIndex,
    overlayVisible: state.readViewStates.overlayVisible,
    leftHand: state.readViewStates.leftHand,
    doublePage: state.readViewStates.doublePage,
    darkMode: state.themeState == "dark"
})

const mapDispatch = {
    dispatchHistory: (chapter: ChapterMeta, page: number): Actions => ({ type: "api_storage_sethistory", chapter: chapter, page: page }),
    dispatchSetPage: (page: number): Actions => ({ type: "readview_setpage", page: page }),
    dispatchChapterReady: (chapter: ChapterInfo): Actions => ({ type: "readview_chapterready", chapter: chapter }),
    dispatchToggleOverlay: (): Actions => ({ type: "readview_toggleoverlay" }),
    dispatchToggleHand: (): Actions => ({ type: "readview_togglehand" }),
    dispatchToggleDoublePage: (): Actions => ({ type: "readview_toggledoublepage" }),
    dispatchToggleDarkMode: (): Actions => ({ type: "theme_toggledark" })
}

const connector = connect(
    mapStates,
    mapDispatch
)

type PropsFromRedux = ConnectedProps<typeof connector>
type ReadViewProps = PropsFromRedux

function ReadViewUpdateCompare(prev: ReadViewProps, next: ReadViewProps) {
    // skip pageIndex compare
    let prevSignificant = {
        ...prev,
        pageIndex: undefined,
    }

    let nextSignificant = {
        ...next,
        pageIndex: undefined,
    }

    type PropKeys = keyof (typeof prevSignificant);

    for (const key in prevSignificant) {
        if (prevSignificant[key as PropKeys] !== nextSignificant[key as PropKeys])
            return false
    }
    return true
}

function InfoDisplay(props: { text: String }) {
    const styles = StyleSheet.create({
        text: {
            position: "absolute",
            top: 0,
            color: "white",
            padding: 10,
            alignSelf: "center"
        }
    })

    return (
        <Text style={styles.text}>{props.text}</Text>
    )
}

function BatteryStatusDisplay(props: { interval: number }) {
    const styles = StyleSheet.create({
        text: {
            position: "absolute",
            top: 0,
            right: 0,
            padding: 10,
            color: "white",
        }
    })

    const [[plugged, level], setBatteryStatus] = React.useState([false, -1])

    const updateStatus = () => (
        BatteryStatus.getPlugged().then(
            plugged => BatteryStatus.getIntLevel().then(level =>
                setBatteryStatus([plugged, level])
            )
        )
    )

    if (level == -1) updateStatus()

    let timeout = setTimeout(updateStatus, props.interval)
    React.useEffect(() => () => clearTimeout(timeout))

    return level == -1 ? null : (
        <Text style={styles.text}>{plugged ? "Plugged" : `${level}%`}</Text>
    )
}

function TextClock(props: { style?: any, interval: number, format: string }) {
    const styles = StyleSheet.create({
        text: {
            position: "absolute",
            top: 0,
            left: 0,
            padding: 10,
            color: "white",
            ...props.style
        }
    })
    const [now, setNow] = React.useState<string>(moment().format(props.format))

    let timeout = setTimeout(() => setNow(moment().format(props.format)), props.interval)
    useEffect(() => () => clearTimeout(timeout))

    return (
        <Text style={styles.text}>{now}</Text>
    )
}

function ReadView(inputProps: ReadViewProps) {
    if (!inputProps.chapter || !inputProps.feeder)
        return <View style={{ flex: 1, backgroundColor: "black" }} />

    let props = {
        ...inputProps,
        feeder: inputProps.feeder as ChapterFeeder,
        chapter: inputProps.chapter as ChapterInfo
    }

    const pageByOff = (offset: number) => {
        props.chapter as ChapterInfo

        let idx = props.pageIndex + offset
        if (idx >= props.chapter.pages.length || idx < 0)
            return

        return props.chapter.pages[idx]
    }

    const viewPager = React.useRef<ViewPagerDynamic>(null)

    const onNextChapter = () => {
        props.feeder.next().then(chapter => {
            if (chapter) {
                props.dispatchSetPage(0)
                props.dispatchHistory(chapter.meta, 0)
                props.dispatchChapterReady(chapter)
            }
        })
    }

    const onPrevChapter = () => {
        props.feeder.prev().then(chapter => {
            if (chapter) {
                props.dispatchHistory(chapter.meta, chapter.pages.length - 1)
                props.dispatchChapterReady(chapter)
                props.dispatchSetPage(chapter.pages.length - 1)
            }
        })
    }

    const onPrevChapterPress = () => {
        props.feeder.prev().then(chapter => {
            if (chapter) {
                props.dispatchHistory(chapter.meta, 0)
                props.dispatchChapterReady(chapter)
                props.dispatchSetPage(0)
            }
        })
    }

    FullScreen.set(true, props.overlayVisible)
    React.useEffect(() => (() => FullScreen.disable()), [])

    console.log(props)

    return (
        <View style={{ flex: 1, backgroundColor: "black" }}>
            <StatusBar hidden={!props.overlayVisible} />
            <BatteryStatusDisplay interval={30 * 1000} />
            <InfoDisplay text={`${props.pageIndex + 1}/${props.chapter.pages.length} ${props.chapter.meta.title}`} />
            <TextClock format="hh:mm A" interval={1000} />

            <ViewPagerDynamic
                ref={viewPager}
                onNext={() => props.dispatchSetPage(props.pageIndex + 1)}
                onPrev={() => props.dispatchSetPage(props.pageIndex - 1)}
                onPrevThanFirst={onPrevChapter}
                onNextThanLast={onNextChapter}
                pagesOnScreen={props.doublePage ? 2 : 1}
                initialPage={props.pageIndex}
                animateDuration={300}
                lastPage={props.chapter.pages.length - 1}
                renderOverlay={() => (
                    <TouchResponder
                        overlayVisible={props.overlayVisible}
                        leftHand={props.leftHand}
                        onToggleOverlay={props.dispatchToggleOverlay}
                        onPressNext={() => viewPager.current && viewPager.current.next()}
                        onPressPrev={() => viewPager.current && viewPager.current.prev()} />
                )}
                renderPage={index => (
                    <View style={{ flex: 1 }}>
                        <ProgressImage
                            resizeMode="contain"
                            indicator={Progress.Pie}
                            style={{ width: '100%', height: '100%' }}
                            source={props.chapter.pages[index].source} />

                    </View>
                )} />

            {props.overlayVisible ? (
                <OverlayControls
                    onPressNextChapter={onNextChapter}
                    onPressPrevChapter={onPrevChapterPress}
                    onSetPage={props.dispatchSetPage}
                    onPressToggleDoublePage={props.dispatchToggleDoublePage}
                    onPressToggleHand={props.dispatchToggleHand}
                    onToggleDark={props.dispatchToggleDarkMode}
                    leftHand={props.leftHand}
                    doublePage={props.doublePage}
                    darkMode={props.darkMode}
                    page={props.pageIndex}
                    totalPages={props.chapter.pages.length} />
            ) : null}
        </View>
    )
}

export default connector(ReadView)