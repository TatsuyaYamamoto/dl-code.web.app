import React, { useRef, useCallback } from "react";

import {
  IconButton,
  Snackbar,
  SnackbarContent,
  Slide,
} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";

interface AudioPlayerProps {
  open: boolean;
  src: string;
  onPlay: () => void;
  onPause: () => void;
  onClose: () => void;
  onError: (e: Error) => void;
}

const SlideTransition = (props: any) => {
  return <Slide {...props} direction="up" />;
};

const NativeAudioController: React.FC<AudioPlayerProps> = ({
  open,
  src,
  onPlay,
  onPause,
  onClose,
  onError,
}) => {
  const audioEl = useRef<HTMLAudioElement | null>(null);

  const onAudioPlay = () => {
    onPlay();
  };
  const onAudioPause = () => {
    onPause();
  };

  const onAudioError = (e: ErrorEvent) => {
    onError(e.error);
  };

  const audioRef = (el: HTMLAudioElement) => {
    if (el) {
      el.addEventListener("play", onAudioPlay);
      el.addEventListener("pause", onAudioPause);
      el.addEventListener("error", onAudioError);
    }

    if (!el && audioEl.current /* prevAudioEl */) {
      audioEl.current.removeEventListener("play", onAudioPlay);
      audioEl.current.removeEventListener("pause", onAudioPause);
      audioEl.current?.removeEventListener("error", onAudioError);
    }

    // save previous element
    audioEl.current = el;
  };

  const onCloseClicked = useCallback(() => {
    if (!audioEl.current) {
      return;
    }

    audioEl.current.pause();
    onClose();
  }, [onClose, audioEl]);

  return (
    <Snackbar open={open} TransitionComponent={SlideTransition}>
      <SnackbarContent
        style={{
          backgroundColor: "white",
        }}
        message={
          <audio autoPlay={true} controls={open} src={src} ref={audioRef} />
        }
        action={[
          <IconButton key="close" onClick={onCloseClicked}>
            <CloseIcon />
          </IconButton>,
        ]}
      />
    </Snackbar>
  );
};

export default NativeAudioController;
