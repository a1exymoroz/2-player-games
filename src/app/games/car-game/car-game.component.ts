import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
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
export class CarGameComponent {
  @ViewChild('frame') frame!: ElementRef<HTMLIFrameElement>;

  // Only the Fullscreen API can hide the browser's own tab/address bar on mobile.
  readonly fullscreenSupported = !!document.documentElement.requestFullscreen;
  isFullscreen = false;

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
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      this.frame.nativeElement
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
