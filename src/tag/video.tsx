import { h, Component, createRef, RefObject } from 'preact';
import { UAParser } from 'ua-parser-js';
import {
  VideoPlayerProps,
  VideoFile,
  VideoPlayerState,
  VideoStatus,
  VideoRatio,
} from '../types/video';
import { inview } from '../tag/intersection-observer';
import { sendMessage } from '@src/lib/message';
import { isRUNAiOS } from '@src/lib/platform';
import { notEmpty } from '@src/lib/typeguard';

const controlButtonStyle = {
  width: '15px',
  height: '15px',
  display: 'block',
  position: 'relative' as const,
  cursor: 'pointer',
};

const styles = {
  video: {
    WebkitMaskImage: '-webkit-radial-gradient(white, black)',
    WebkitBackfaceVisibility: 'hidden',
    MozBackfaceVisibility: 'hidden',
    WebkitAppearance: 'none',
    width: '100%',
    border: 'none',
  },
  videoWrapper: {
    position: 'relative' as const,
    background: 'black',
    width: '100%',
  },
  controlsWrapper: {
    display: 'flex',
    position: 'absolute' as const,
    bottom: 10,
    right: 10,
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'rgba(50, 50, 50, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  controlButton: controlButtonStyle,
  playButton: {
    ...controlButtonStyle,
    ...{
      background:
        "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAApCAYAAABdnotGAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAb9JREFUeNrsmM1HRFEYxufmpihtixbVomjZLhER0SLRor8gIiIi+lBKJaJEJIk+iPQhWiSiUUnSMmIWaTOLihalpA/T7/IOGTPNx733zLvo8FvMnXuvx3nOed/nHisSiQQ0jZyAshFPUDvUZEuQFWNZIYTAubgFk/CQzRmK/rZkpk6gA2wta6gIxuAQajUt6mrYgXko1rLLHBvb4BQ6/bIxk23vLPwROII6TXWoCrZhAUo0FcZWsbELcrVU6gIYEhvrNbWOStiERSjV1MtaIAjd6droZ3N1bOwXYQ2aun0FbMByKjaajB/Nsht7IE9LHsqHPjiGRk0BrRzWYQXKNCXGJpmtXpk9FRE2XwTNasrUd7AWMJkEE4x3mJMG/ZFtQQcwDOHfF7Mh6FYacTDenyYFvYo9TuP9THSTKUH78rEQTnaj34JCYs9Zqg/YPtrj1JWlv+wxJWgPRuE+k4dtj+0ZgHM3L/FC0AvMSN75cvsyN4KcA4ldGM/UHi8F3cAgXHi9ANMV9AzTsOqFPW4ERc+LJuDRz8KViqBr2T1XJkq6ncSeKYma36YaXqygN7iUjuzsnifTUcD6PxZOMn4EGABQ4lY+jeSAkgAAAABJRU5ErkJggg==') 50% 50% / contain no-repeat transparent",
      order: 1,
      width: '15px',
    },
  },
  pauseButton: {
    ...controlButtonStyle,
    ...{
      background:
        "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAApCAYAAABdnotGAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAMhJREFUeNrsmD0KAjEQhRNXxUKxF2vxCh7AW3ghj7FXUxHRwkVBRZD4wm6zwmSmEIzwBr4mQ5IvP9XzIQSXU3VcZtUVxmdgIPQqsDGs7cEc9IT+ERwsQktQJjZ6gQXYKUIrsE70n43wQ3uyobJRAUaGGxor/X5D3n+IQhSiEIUoRCEKUYhCFKIQhShEIQpRiEI/F7ooc2KCdjWsXSn9u6tTtFZ5IYWdODkbvIGTQShmjNPEK8SDnz8HpdBz/4Xbjyfd/v0fegswAEzeHRINCOhCAAAAAElFTkSuQmCC') 50% 50% / contain no-repeat transparent",
      order: 1,
      width: '15px',
    },
  },
  replayButton: {
    ...controlButtonStyle,
    ...{
      background:
        "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACUAAAApCAYAAACyXOB4AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAoFJREFUeNrsmE1IVFEYhtWGtNIM1EiTaiMVBo0URYUJSasiCiRz0yJoIUTtdFNBrgRpIYQrFy0CyYUt+9mliyiKSIKCUgYlUiwspszUvD2HvuB2mTvnzD3nDhK+8MAw3Pnmnbnf/X5Ooed5BStNhf+7qTVwBp7BhFUkZcoRp70/SsMlKIoay6Wpdu9fjcDOlWZKaQ46IZFLrKg5VQxHoAl2Qy1shW0h17+ACzAaR07tgF747OWuBbgBa13dvlK4KYFt9Rr22d6+JAxCncNS9BVqYC5KnWqGe1DmuD6moQp+5ppTB+G7517v4VCUnKqBacdmlqEPNkRN9IeODU3AcZvi2WL4Rb9gAE7BdrgSct1tKLep6CrxRw0MvYQGTUWfEsPWbabZwNDjkLxo810zCJWuGnK/QW5UhQRbB11w0raPBt9IaUydd9jAjSr6FviYpeB9kIa7HPfkWeR7rWsj9/NhKGiqQnPtWL5m9ITv9XqDJmqrs3BM9dwMsXtgJmgqrQm42dJQNQwE7o5fJXA5ePumNUH3Wpo6msWQ0mKmKaFcmmaYvkGZxaN+R1NuLobVqVeaD16PaKjOYGqtDzPVrfmgmq+SORpSM/mwJu649N2MpvYY9L5J/6/SUAx3DWJ26UaXBwZBvshUkG2fOyDThE4/oFq3OOyHp5on5a9SMATPYQpKYReckJ3QRKo+dZjM6Le8/Ghc1jejFUsVsieyXsWlBWiUUxrjbaZW5qc4tATnom7IavZ+49jQfDZDpmv7JhhyZGhM9klnR0GtkphRNAvXMiW1i/OphCwIj2DRwMxbuCr/duznUwVyvnAY6mUs2ShnA5/gnTy9qdXT4Tj1W4ABAKadIx8bRyhHAAAAAElFTkSuQmCC') 50% 50% / contain no-repeat transparent",
      order: 1,
      width: '15px',
    },
  },
  muteButton: {
    ...controlButtonStyle,
    ...{
      background:
        "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAiCAYAAAAd6YoqAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAjBJREFUeNrc2U9IFUEcwHFXTShUSKUQQx+dREE0BBXCkjoIklhdOkU3b2IPUfAgCCH4P/Mf3Q2CbiIo0kHxoBcrkk4SokU3QQwRUVy/gyMs47x1dfetuzvwObydH7vvx/x2Zt48wzTNlCi01JSItGQlUoo3KPEtE1FaHuvCsXnaDlGXhGec4+WIpOEjumHIa+lo9mNA0j26z018RqOmryAsieRgBjXX+bK7TaQIcygO86xVhuUgJOEmkTosIT8o64iutG7I+T9R2ZVjAhkunpuFIbneiHtN2cTeRr8c+RF8cbKOZOCb6W1b0sz775SYeIL1IRerlrgD3HWyjoi6r/ChErKUz4NoV67l4SseKNVyy8mIPDS9b7oRycemJrZT9t/BT03/YKKV/boSEWLY0MT34pfm+giMICYiFOK3g3sM+LnXukrbwmOs28T0oS0Mv0f+4LV4XTV9K+gIyw8rsc35ZNkxW1u1nNECn0gMC7hvExOXC6ER1ETEl1+UyVhbD9aUay0YtU1GeftrfJq17mFLE9su+/PwXdP/3un0m41tHxIZ1cTFL9ienLWYLhF1Y7iLSjyxKbvnqHdZVrvWokArPigx23iKefmdRDvCvleHD2mYdDkimRjHIl5d8Lxs+TwR+9JpaV3GWxy5XNkDcYoyjBfYi8IB3TQe4V8UThpXUYUfUTgy/YtazGr6dsJ29vsfzzCmXJ/1IxEjSX8rNKBJltskjsOaSGT+VvC9nQgwAJIzUxtEFbq7AAAAAElFTkSuQmCC') 50% 50% / contain no-repeat transparent",
      order: 2,
      width: '25px',
    },
  },
  noMuteButton: {
    ...controlButtonStyle,
    ...{
      background:
        "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAiCAYAAAAd6YoqAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAxlJREFUeNrsmU1IVUEUx9/zK1PTlCijouwLKigx+1oU6NvY16usTVHQIqRsU4uiVZtwUcuCpEVFEiQtRGgRERZlKRFZkQouyiILwowoiz703f5Dc+HP6b6r3Dfz3kM68IOZOfeeN+fOmZkz88KO44QmgmSEJojYcmQZ2A+WJs0TFVqGOQlizl/5DaoC2pkGWkAv2DvW8yYdyAQXnH+lOaC9BrIxAqJ+z5sKrcmgBdR56GYFtDlI5UxwDZTbDK0S0OHEl/aAdnNAm7DVA3JtjMhc8BCsMzCqZeAIqNT1X6AW9NEzavE4bnpEloP3ztgynhGZCoZoPtSQrlwvGq4M64XAyIhUgXYw09Acmw9KaD40g0W6/gycpWfzwUFpIOyxs2frIcyK86Nqwp0HOePs5AOwnup5IAL6QTd1/rb+QK7cBdW6PB281otKSJeV80680FITrMsxKxxa6sN16vZRUEe6IvBSvBshfZPQrfbbRyod88KOlArdT7CC9NVCf4t0m4TuhN8cybWcSHwAj6muwrOB6ndAJ9VVCBbrspqTI6RblcqkUcX0TjBMbRtBKdWvi41wjS5/1XPDlcWpzn7fgquiD2up/kQ8zx1+Q+UZ6ZDGPxd1XsY/CV0elX9QeVI6OFIs6tzBKUIXE6Hm1Z4SR8Jgl2jrpvICj1B0hefSUKodUblSBdUHxLzYIp7votFYSO2vUulIITgl2s5QmMwB20Rn+yijKCDdCz9HRi07EhO/0abTHVdOUxqi5DKVo8LWPb/st5CyUBs7u2IruA8u6rTEba8X733UZx2lywL9IgPOZ7syMfyizwMRn7DbAWoSGJUbGpYlIsNVcoyW4t1gHulawbdEzyPqbN6YwIh4ERHvXCFdARgQ+gqTlw9H9SHIhCMZuvOD+gIjm3SXhL1WG7coUR2vjoUzu+KwsPUdlNm6DloJ3llwpJbux1w5ZPteazZ4atiRR8JOUzLutdTuvAHc9NB9DmizQ6x0B5J5ZapWtHPiS9YHtKX2jn1gj5j8noQt/a2wGWzXNyCNMlO1kon+/38kzeSPAAMApIvJcfAUG8cAAAAASUVORK5CYII=') 50% 50% / contain no-repeat transparent",
      order: 2,
      width: '25px',
    },
  },
  timeBar: {
    order: 3,
    color: '#fff',
    display: 'flex',
    marginLeft: 'auto',
    marginRight: '15px',
    fontSize: '14px',
  },
  timeBarItems: {
    margin: '0px 5px 0px 0px',
  },
  seekBar: {
    position: 'absolute' as const,
    left: '0',
    bottom: '27px',
    height: '5px',
    width: '100%',
    backgroundColor: '#222',
  },
  progress: (width: number): h.JSX.CSSProperties => ({
    position: 'absolute' as const,
    left: 0,
    bottom: '27px',
    height: '5px',
    width: `${width}%`,
    backgroundColor: '#555',
  }),
};

interface CustomEventTarget extends EventTarget {
  currentTime?: number;
}

export class VideoPlayer extends Component<VideoPlayerProps, VideoPlayerState> {
  private readonly videoRef: RefObject<HTMLVideoElement>;
  private readonly wrapperRef: RefObject<HTMLDivElement>;
  public constructor(props: VideoPlayerProps) {
    super(props);
    this.state = {
      muted: true,
      videoStatus: VideoStatus.Paused,
      current: 0,
      controledPause: false,
      trackings: [],
    };
    this.makeTrackingState();

    this.videoRef = createRef();
    this.wrapperRef = createRef();
  }

  public componentDidMount(): void {
    // MEMO: for Web
    if (this.wrapperRef?.current && !this.props.isApp) {
      inview(this.wrapperRef.current, 0.5, this.handlePlay, this.handleStop);
    }
    // MEMO: for App
    if (this.props.isApp) {
      window.addEventListener('play', (ev) => {
        if (this.state.videoStatus !== VideoStatus.Ended) {
          this.handlePlay(ev);
        }
      });
      window.addEventListener('pause', (ev) => {
        if (this.state.videoStatus !== VideoStatus.Ended) {
          this.handleStop(ev);
        }
      });
    }

    if (isRUNAiOS()) {
      this.videoRef.current?.load();
    }

    this.setVideoStartPosition(this.state.current);
  }

  public componentWillUnmount(): void {
    if (this.props.isApp) {
      window.removeEventListener('play', this.handlePlay);
      window.removeEventListener('pause', this.handleStop);
    }
  }

  private makeTrackingState(): void {
    const { events, duration } = this.props;
    this.setState({
      trackings: events.map((e) => {
        const getDuration = (): number => {
          switch (e.type) {
            case 'start':
              return 0;
            case 'firstQuartile':
              return duration / 4;
            case 'midpoint':
              return duration / 2;
            case 'thirdQuartile':
              return (duration / 4) * 3;
            case 'complete':
              return duration;
            default:
              return 0;
          }
        };
        return {
          type: e.type,
          duration: getDuration(),
          urls: e.urls,
          requested: false,
        };
      }),
    });
  }

  private readonly handleTimeUpdate = (e: Event): void => {
    const currentTime = (e.target as CustomEventTarget)?.currentTime ?? 0;
    const sortedTrackings = this.state.trackings.sort((a, b) =>
      b.duration > a.duration ? -1 : 1
    );
    sortedTrackings.forEach((tracking, i) => {
      if (!tracking.requested && tracking.duration < currentTime) {
        this.trackEvents(tracking.urls);
        sortedTrackings[i] = { ...tracking, requested: true };
        this.setState({ trackings: sortedTrackings });
      }
    });

    this.setState({
      current: currentTime,
    });
  };

  private readonly handlePlay = (event?: Event): void => {
    if (event && event.type === 'click') {
      this.setState({ controledPause: false });
    } else if (
      this.state.videoStatus !== VideoStatus.Paused ||
      this.state.controledPause
    ) {
      return;
    }
    void this.videoRef.current?.play();
    this.setState({
      videoStatus: VideoStatus.Playing,
    });
  };

  private readonly handleStop = (event?: Event): void => {
    if (event && event.type === 'click') {
      this.videoRef.current?.pause();
      this.setState({
        videoStatus: VideoStatus.Paused,
        controledPause: true,
      });
    } else if (this.state.videoStatus === VideoStatus.Playing) {
      this.videoRef.current?.pause();
      this.setState({ videoStatus: VideoStatus.Paused });
    }
  };

  private readonly handleEnded = (): void => {
    const newTrackings = this.state.trackings;
    this.state.trackings.forEach((tracking, i) => {
      if (!tracking.requested && tracking.type === 'complete') {
        this.trackEvents(tracking.urls);
        newTrackings[i] = {
          ...tracking,
          requested: true,
        };
      }
    });
    this.setState({ videoStatus: VideoStatus.Ended, trackings: newTrackings });
  };

  private readonly renderPlayingControlButton = (
    status: VideoStatus
  ): h.JSX.Element | null => {
    switch (status) {
      case VideoStatus.Playing:
        return this.state.muted ? (
          <div style={styles.muteButton} />
        ) : (
          <div style={styles.noMuteButton} />
        );
      case VideoStatus.Paused:
        return <div style={styles.playButton} />;
      case VideoStatus.Ended:
        return <div style={styles.replayButton} />;
      default:
        return null;
    }
  };

  private trackEvents(urls: string[]): void {
    void Promise.all(
      urls.map((url) =>
        fetch(url).catch((err) => {
          throw err;
        })
      )
    );
  }

  private setVideoStartPosition(time: number): void {
    if (this.videoRef?.current) {
      this.videoRef.current.currentTime = time;
    }
  }

  private getRatio(file: VideoFile): VideoRatio | undefined {
    const ratio = file.width / file.height;
    /*
      Landscape: 16:9
      Square: 1:1
      Portrait: 9:16
    */
    if (ratio === 1.7777777777777777) {
      return 'LandScape';
    } else if (ratio === 1) {
      return 'Spuare';
    } else if (ratio === 0.5625) {
      return 'Portrait';
    }
    return undefined;
  }

  // MEMO: They are temporary thumbnails
  private getThumbnail(ratio: VideoRatio): string | undefined {
    if (process.env.IMAGE_PATH) {
      switch (ratio) {
        case 'LandScape':
          return `${process.env.IMAGE_PATH}/loading-1280x720.gif`;
        case 'Spuare':
          return `${process.env.IMAGE_PATH}/loading-720x720.gif`;
        case 'Portrait':
          return `${process.env.IMAGE_PATH}/loading-720x1280.gif`;
      }
    }
    return undefined;
  }

  /*
    If user's device is mobile, we should serve the smallest video.
    In other devices, we should serve the secound smallest one.
  */
  private getVideoSources(files: VideoFile[]): VideoFile[] {
    const [firstMp4, secoundMp4] = files
      .filter((f) => f.type === 'video/mp4')
      .sort((a, b) => (a.width < b.width ? -1 : 1));
    const [firstWebm, secoundWebm] = files
      .filter((f) => f.type === 'video/webm')
      .sort((a, b) => (a.width < b.width ? -1 : 1));

    return (
      new UAParser().getDevice().type === 'mobile'
        ? [firstMp4, firstWebm]
        : [secoundMp4, secoundWebm]
    ).filter(notEmpty);
  }

  public render(): h.JSX.Element {
    const { files } = this.props;
    const ratio = files[0] && this.getRatio(files[0]);
    const thumbnail = ratio && this.getThumbnail(ratio);
    return (
      <div style={styles.videoWrapper} ref={this.wrapperRef}>
        <video
          poster={thumbnail}
          muted={this.state.muted}
          playsInline
          // eslint-disable-next-line react/no-unknown-property
          webkit-playsinline
          onEnded={this.handleEnded}
          onTimeUpdate={this.handleTimeUpdate}
          ref={this.videoRef}
          style={styles.video}
          onLoadedData={() => {
            sendMessage({ type: 'video_loaded', vendor: 'rdn' });
          }}
        >
          {this.getVideoSources(files).map((f: VideoFile, i) => (
            <source key={i} src={f.src} type={f.type} />
          ))}
          I&apos;m sorry, your browser doesn&apos;t support HTML5 video in WebM
          with VP8/VP9 or MP4 with H.264.
        </video>
        <div>
          <div
            style={styles.controlsWrapper}
            onClick={(event: Event) => {
              event.preventDefault();
              event.stopPropagation();
              switch (this.state.videoStatus) {
                case VideoStatus.Playing:
                  this.state.muted
                    ? this.setState({ muted: false })
                    : this.setState({ muted: true });
                  break;
                case VideoStatus.Paused:
                  this.handlePlay(event);
                  break;
                case VideoStatus.Ended:
                  this.handlePlay(event);
              }
            }}
          >
            {this.renderPlayingControlButton(this.state.videoStatus)}
          </div>
        </div>
      </div>
    );
  }
}
