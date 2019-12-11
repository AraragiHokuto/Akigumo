import CryptoJS from 'crypto-js'
import HTMLParser from 'fast-html-parser'

import { ChapterFeeder, ChapterInfo, ChapterMeta, SearchResultFeeder, MangaAPI, MangaMeta, MangaInfo } from 'src/MangaAPI'

const userAgent = "Mozilla/5.0 (X11; Linux x86_64; rv:70.0) Gecko/20100101 Firefox/70.0"

function decodeChapterImages(input: string) {
    const key = CryptoJS.enc.Utf8.parse("123456781234567G")
    const iv = CryptoJS.enc.Utf8.parse("ABCDEF1G34123412")
    let decryptedStr = CryptoJS.AES.decrypt(
        input, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
    ).toString(CryptoJS.enc.Utf8)
    return JSON.parse(decryptedStr)
}

function parseComicHTML(html: string, referer: string) {
    let chapterImagesMatch = /chapterImages = "([^"]+)"/.exec(html)
    let prevChapterDataMatch = /prevChapterData = ([^;]*)/.exec(html)
    let nextChapterDataMatch = /nextChapterData = ([^;]*)/.exec(html)
    let chapterPathMatch = /chapterPath = "([^"]*)"/.exec(html)

    let chapterImages = chapterImagesMatch ? decodeChapterImages(chapterImagesMatch[1]) : undefined
    let prevChapterData = prevChapterDataMatch ? JSON.parse(prevChapterDataMatch[1]) : undefined
    let nextChapterData = nextChapterDataMatch ? JSON.parse(nextChapterDataMatch[1]) : undefined
    let chapterPath = chapterPathMatch ? chapterPathMatch[1] : undefined

    let root = HTMLParser.parse(html)
    let chapterTitleDOM = root.querySelector('.head_title h2')
    let chapterTitle = chapterTitleDOM.text

    console.log(chapterImages)

    const uriFromItem = (item: string) => {
        if (item.startsWith("http")) {
            if (/eshanyao/.exec(item) != null)
                return item
            else
                return `https://mhimg.eshanyao.com/showImage.php?url=${encodeURI(item)}`
        } else {
            return `https://mhimg.eshanyao.com/${chapterPath}${item}`
        }
    }

    let imageSources = chapterImages.map((item: string) => ({
        uri: uriFromItem(item),
        headers: {
            'User-Agent': userAgent,
            Referer: referer
        }
    }))

    return {
        prevChapter: prevChapterData.id as string | null,
        nextChapter: nextChapterData.id as string | null,
        title: chapterTitle,
        sources: imageSources
    }
}

function parseMangaHTML(html: string, meta: MangaMeta, referer: string) {
    let root = HTMLParser.parse(html)

    let cover = root.querySelector(".comic_i_img img")
    let coverSource = {
        uri: cover.attributes['src'],
        headers: {
            'User-Agent': userAgent,
            Referer: referer
        }
    }
    let title = cover.attributes['alt']

    let entries = root.querySelectorAll('#chapter-list-1 li a')

    let chapters = entries.map(item => {
        console.log(item.attributes['href'])
        let hrefMatch = /\/manhua\/([^\/]+)\/(\d+)/.exec(item.attributes['href'])
        let manga = hrefMatch && hrefMatch[1]
        let chapterId = hrefMatch && hrefMatch[2]
        let title = item.attributes['title']

        console.log(chapterId)

        return {
            mangaNo: manga as string,
            chapterNo: chapterId as string,
            title: title
        }
    })

    return {
        meta: {
            ...meta,
            coverSource: coverSource,
            title: title,
        },
        chapters: chapters
    }
}

function parseSearchResult(html: string, referer: string) {
    let root = HTMLParser.parse(html)
    let entries = root.querySelectorAll('.list-comic a.image-link')

    let resultCount = parseInt(root.querySelector('.comi_num em').text)

    let results = entries.map(item => {
        let title = item.attributes['title']
        let mangaIdMatch = /\/manhua\/([^\/]*)\//.exec(item.attributes['href'])
        let mangaId = mangaIdMatch && mangaIdMatch[1]
        let coverElement = item.querySelector('img')
        let coverSource = {
            uri: coverElement.attributes['src'],
            headers: {
                'User-Agent': userAgent,
                Referer: referer
            }
        }

        return {
            title: title,
            id: mangaId as string,
            coverSource: coverSource
        }
    })

    return {
        totalCount: resultCount,
        results: results
    }
}

class ManhuaduiChapterFeeder implements ChapterFeeder {
    nextChapter: string | null = null
    prevChapter: string | null = null
    chapterId: string
    mangaId: string

    constructor(meta: ChapterMeta) {
        this.chapterId = meta.chapterNo
        this.mangaId = meta.mangaNo
    }

    async current() {
        const pageUrl = `https://www.manhuadui.com/manhua/${this.mangaId}/${this.chapterId}.html`
        console.log(`fetching ${pageUrl}`)
        return fetch(pageUrl, {
            headers: {
                'User-Agent': userAgent
            }
        }).then(res => res.text().then(html => {
            let parseResult = parseComicHTML(html, pageUrl)
            this.prevChapter = parseResult.prevChapter
            this.nextChapter = parseResult.nextChapter
            return {
                meta: {
                    title: parseResult.title,
                    mangaNo: this.mangaId,
                    chapterNo: this.chapterId
                },
                pages: parseResult.sources.map((item: any) => ({ source: item }))
            }
        }))
    }

    async prev() {
        if (!this.prevChapter)
            return null

        this.chapterId = this.prevChapter
        return this.current()
    }

    async next() {
        if (!this.nextChapter)
            return null

        this.chapterId = this.nextChapter
        return this.current()
    }
}

class ManhuaduiSearchResultFeeder implements SearchResultFeeder {
    totalResults: number = 0
    currentPage: number = 0

    constructor(private queryStr: string) { }

    async more() {
        if (this.currentPage != 0 && this.currentPage * 36 >= this.totalResults)
            return []

        this.currentPage += 1

        let searchUrl = `https://www.manhuadui.com/search/?keywords=${this.queryStr}&page=${this.currentPage}`
        return fetch(searchUrl, { headers: { 'User-Agent': userAgent } })
            .then(res => res.text().then(html => {
                let parseResult = parseSearchResult(html, searchUrl)
                this.totalResults = parseResult.totalCount
                return parseResult.results
            }))
    }
}

export default class ManhuaduiAPI implements MangaAPI {
    name: string = "manhuadui"

    getFavorite(entries: MangaMeta[]) {
        return new Promise<MangaMeta[]>(resolve => resolve(entries))
    }

    addFavorite(entries: MangaMeta[], entry: MangaMeta) {
        if (entries.find(item => item.id == entry.id))
            return new Promise<MangaMeta[]>(resolve => resolve(entries))
        return new Promise<MangaMeta[]>(resolve => resolve(entries.concat([entry])))
    }

    removeFavorite(entries: MangaMeta[], entry: MangaMeta) {
        return new Promise<MangaMeta[]>(resolve => resolve(entries.filter(item => item.id != entry.id)))
    }

    getManga(meta: MangaMeta) {
        let mangaUrl = `https://www.manhuadui.com/manhua/${meta.id}/`

        return fetch(mangaUrl, { headers: { 'User-Agent': userAgent } })   
            .then(res => res.text().then(html => parseMangaHTML(html, meta, mangaUrl)))
    }

    async search(str: string) {
        return new ManhuaduiSearchResultFeeder(str)
    }

    async getChapterFeeder(chapter: ChapterMeta) {
        return new ManhuaduiChapterFeeder(chapter)
    }
}