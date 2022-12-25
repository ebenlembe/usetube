import Video from './types/video'
import getData from './helpers/getData'
import formatVideo from './helpers/formatVideo'
import findVal from './helpers/findVal'

export default async function getChannelStreams(id: string, published_after?: Date) {
  try {
    const data: any = await getData('https://m.youtube.com/channel/'+id+'/streams')
    const apikey = data.apikey
    const tabs: any[] = data.contents.singleColumnBrowseResultsRenderer.tabs.filter((t) => t.tabRenderer.title === 'Live')
    if (!tabs || !tabs.length) {
      throw new Error('No livestreams found')
    }
    const channel = tabs[0].tabRenderer.content.richGridRenderer?.contents || []
    let token: string = findVal(data, 'token')
    let videos: Video[] = []
    for(let i = 0; i < channel.length; i++) {
      let video: Video = await formatVideo(channel[i].richItemRenderer?.content, false)
      if (video && video.publishedAt) {
        if ((published_after && video.publishedAt.getTime() > published_after.getTime())  || !published_after) {
          videos.push(video)
        }
      }
    }
    while(token) {
      try {
        let data = await getData('https://www.youtube.com/youtubei/v1/browse?key='+apikey+'&token='+token)
        let newVideos: any = data.items
        if (data.token === token) {
          break;
        }
        token = data.token
        for(let i = 0; i < newVideos.length; i++) {
          let video: Video = await formatVideo(newVideos[i], false)
          if (video) {
            if (published_after) {
              if (video.publishedAt.getTime() > published_after.getTime()) {
                videos.push(video)
              } else {
                token = ''
              }
            }
            else {
              videos.push(video)
            }
          }
        }
      } catch(e) {
        console.log('getChannelStreams failed')
        // console.log(e)
        token = ''
      }
    }
    return videos
  } catch(e) {
    console.log('cannot get channel streams for id: '+id+', try again')
    console.log(e)
  }
}
