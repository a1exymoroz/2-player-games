import { Component, ElementRef, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

// The game itself is a Unity Web build copied into src/assets/car-game
// (source: the private a1exymoroz/2-players Unity project, menu Build > Web).
// This page only frames it and handles fullscreen/orientation on phones.
@Component({
  selector: 'app-car-game',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './car-game.component.html',
  styleUrl: './car-game.component.scss'
})
export class CarGameComponent implements OnDestroy {
  @ViewChild('frame') frame!: ElementRef<HTMLIFrameElement>;
  // Fullscreen goes on the stage (game + HTML overlays), not the iframe, so the overlays stay visible.
  @ViewChild('stage') stage!: ElementRef<HTMLDivElement>;

  // Text UI is drawn here in HTML from the game's events (see WebEvents.cs in the Unity project).
  score = { red: 0, blue: 0 };
  winner: 'red' | 'blue' | null = null;
  suddenDeath = false;
  private bannerTimer?: ReturnType<typeof setTimeout>;

  @HostListener('window:message', ['$event'])
  onGameEvent(event: MessageEvent): void {
    if (event.source !== this.frame?.nativeElement.contentWindow || event.data?.source !== 'car-duel') return;
    const { type, data } = event.data;
    if (type === 'score') this.score = { red: data.red, blue: data.blue };
    if (type === 'matchOver') this.winner = data.winner;
    if (type === 'suddenDeath') {
      this.suddenDeath = true;
      clearTimeout(this.bannerTimer);
      this.bannerTimer = setTimeout(() => (this.suddenDeath = false), 2400);
    }
  }

  playAgain(): void {
    this.winner = null;
    const game = this.frame.nativeElement.contentWindow as (Window & { unityInstance?: { SendMessage(o: string, m: string): void } }) | null;
    game?.unityInstance?.SendMessage('Game', 'NewMatch');
    this.focusGame();
  }

  ngOnDestroy(): void {
    clearTimeout(this.bannerTimer);
  }

  // Only the Fullscreen API can hide the browser's own tab/address bar on mobile.
  readonly fullscreenSupported = !!document.documentElement.requestFullscreen;
  isFullscreen = false;

  // iPhone Safari has no Fullscreen API for pages: the button then stretches the game over the
  // whole browser window instead (header hidden, × to come back).
  expanded = false;

  // iOS Safari has no Fullscreen API; a Home Screen launch gives a chrome-free view instead.
  readonly showInstallHint =
    !this.fullscreenSupported &&
    !(navigator as Navigator & { standalone?: boolean }).standalone &&
    !window.matchMedia('(display-mode: standalone)').matches;

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    this.isFullscreen = !!document.fullscreenElement;
    if (!this.isFullscreen) this.unlockOrientation(); // locked until you go back, not forever
  }

  toggleFullscreen(): void {
    if (!this.fullscreenSupported) {
      this.expanded = !this.expanded;
      return;
    }
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      this.stage.nativeElement
        .requestFullscreen()
        .then(() => this.lockLandscape())
        .catch(() => {});
    }
  }

  // Keyboard players (A/D, ←/→) can start right away without clicking into the frame first.
  focusGame(): void {
    this.frame.nativeElement.focus();
  }

  // Best-effort: Orientation Lock exists only on Chromium/Android and needs an active fullscreen element.
  private lockLandscape(): void {
    (screen.orientation as ScreenOrientation & { lock?(orientation: string): Promise<void> })
      ?.lock?.('landscape')
      .catch(() => {});
  }

  private unlockOrientation(): void {
    (screen.orientation as ScreenOrientation & { unlock?(): void })?.unlock?.();
  }
}
