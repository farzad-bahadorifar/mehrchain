import { Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-username-settings',
  imports: [FormsModule],
  template: `
    <section
      class="mb-5 rounded-2xl border border-border bg-card p-4 space-y-3"
      aria-label="Username settings"
    >
      <h2 class="text-sm font-bold text-foreground">Username</h2>
      @if (auth.currentUser()?.usernameSource === 'legacy' && auth.currentUser()?.username) {
        <p class="text-xs text-muted-foreground">
          Existing username · Save to confirm your choice.
        </p>
      }
      <form (ngSubmit)="save()" class="space-y-3">
        <fieldset [disabled]="saving()" class="space-y-3 min-w-0">
          <label for="profile-username" class="block text-xs text-muted-foreground">Username</label>
          <input
            id="profile-username"
            name="username"
            [ngModel]="draft()"
            (ngModelChange)="edit($event)"
            maxlength="20"
            autocomplete="username"
            autocapitalize="none"
            spellcheck="false"
            placeholder="3–20 letters, numbers or underscores"
            class="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground"
          />
          <p class="text-xs text-muted-foreground" role="status">{{ availabilityMessage() }}</p>
          <div class="flex flex-wrap gap-3">
            <button
              type="button"
              (click)="cancelEdit()"
              class="min-h-11 rounded-xl bg-muted px-4 text-sm text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="!valid() || availability() === 'checking' || availability() === 'taken'"
              class="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
            >
              {{ saving() ? 'Saving…' : 'Save username' }}
            </button>
            @if (auth.currentUser()?.username) {
              <button
                type="button"
                (click)="confirmRemoval.set(true)"
                class="min-h-11 text-sm text-muted-foreground"
              >
                Remove username
              </button>
            }
            @if (availability() === 'error') {
              <button
                type="button"
                (click)="retryCheck.update(increment)"
                class="text-sm text-primary underline"
              >
                Retry check
              </button>
            }
          </div>
        </fieldset>
      </form>
      @if (confirmRemoval()) {
        <div class="rounded-xl border border-border p-3" aria-label="Confirm username removal">
          <p class="text-sm text-foreground">Remove your username?</p>
          <p class="text-xs text-muted-foreground mt-2">
            Your email, Google access and account data stay. This does not delete your account.
          </p>
          <div class="flex flex-wrap gap-2 mt-3">
            <button
              type="button"
              [disabled]="saving()"
              (click)="confirmRemoval.set(false)"
              class="min-h-11 rounded-xl bg-muted px-3 text-sm text-foreground"
            >
              Keep username
            </button>
            <button
              type="button"
              [disabled]="saving()"
              (click)="save(true)"
              class="min-h-11 rounded-xl border border-border px-3 text-sm text-foreground"
            >
              Confirm removal
            </button>
          </div>
        </div>
      }
      @if (feedback()) {
        <p role="status" class="text-xs text-foreground">{{ feedback() }}</p>
      }
      @if (error()) {
        <p role="alert" class="text-xs text-destructive">{{ error() }}</p>
      }
      @if (auth.currentUser()?.hasPassword && auth.currentUser()?.username) {
        <p class="text-xs text-muted-foreground">
          Sign in with email or this username and your password.
        </p>
      }
    </section>
  `,
})
export class UsernameSettingsComponent {
  readonly auth = inject(AuthService);
  readonly draft = signal('');
  readonly dirty = signal(false);
  readonly saving = signal(false);
  readonly confirmRemoval = signal(false);
  readonly error = signal('');
  readonly feedback = signal('');
  readonly retryCheck = signal(0);
  readonly increment = (value: number) => value + 1;
  readonly normalized = computed(() => this.draft().trim().toLowerCase());
  readonly valid = computed(
    () => !this.normalized() || /^[a-z0-9_]{3,20}$/.test(this.normalized()),
  );
  readonly availability = signal<'idle' | 'checking' | 'available' | 'taken' | 'error' | 'invalid'>(
    'idle',
  );
  readonly availabilityMessage = computed(
    () =>
      ({
        idle: 'Leave blank to use email or Google only.',
        checking: 'Checking…',
        available: 'Available',
        taken: 'That username is already taken.',
        error: 'Could not check availability.',
        invalid: 'Use 3–20 letters, numbers or underscores.',
      })[this.availability()],
  );
  private destroyed = false;
  private session: string | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
    });
    effect(() => {
      const user = this.auth.currentUser();
      const key = `${user?.id}:${this.auth.getToken()}`;
      untracked(() => {
        if (key !== this.session) {
          this.session = key;
          this.dirty.set(false);
          this.error.set('');
          this.feedback.set('');
          this.saving.set(false);
          this.confirmRemoval.set(false);
        }
        if (!this.dirty()) this.draft.set(user?.username || '');
      });
    });
    effect((cleanup) => {
      const username = this.normalized();
      const user = this.auth.currentUser();
      const token = this.auth.getToken();
      this.retryCheck();
      if (!username) {
        this.availability.set('idle');
        return;
      }
      if (!this.valid()) {
        this.availability.set('invalid');
        return;
      }
      if (username === user?.username?.toLowerCase()) {
        this.availability.set('available');
        return;
      }
      if (!user || this.auth.isLocalToken(token)) {
        this.availability.set('error');
        return;
      }
      this.availability.set('checking');
      let cancelled = false;
      let request: Subscription | undefined;
      const current = () =>
        !cancelled &&
        !this.destroyed &&
        this.auth.currentUser()?.id === user.id &&
        this.auth.getToken() === token;
      const timer = setTimeout(() => {
        request = this.auth.usernameAvailability(username).subscribe({
          next: (result) => {
            if (current() && result.username === username)
              this.availability.set(result.available ? 'available' : 'taken');
          },
          error: () => {
            if (current()) this.availability.set('error');
          },
        });
      }, 500);
      cleanup(() => {
        cancelled = true;
        clearTimeout(timer);
        request?.unsubscribe();
      });
    });
  }

  edit(value: string) {
    this.draft.set(value);
    this.dirty.set(true);
    this.error.set('');
    this.feedback.set('');
  }

  cancelEdit(): void {
    this.draft.set(this.auth.currentUser()?.username || '');
    this.dirty.set(false);
    this.error.set('');
    this.feedback.set('');
    this.confirmRemoval.set(false);
  }

  async save(remove = false) {
    if (!remove && !this.normalized()) {
      this.error.set('Enter a username, or choose Remove username.');
      return;
    }
    if (
      this.saving() ||
      (!remove && (!this.valid() || ['checking', 'taken'].includes(this.availability())))
    )
      return;
    const id = this.auth.currentUser()?.id;
    const token = this.auth.getToken();
    const current = () =>
      !this.destroyed && this.auth.currentUser()?.id === id && this.auth.getToken() === token;
    this.saving.set(true);
    this.error.set('');
    this.feedback.set('');
    try {
      const user = await this.auth.updateUsername(remove ? null : this.normalized() || null);
      if (!current()) return;
      this.draft.set(user.username || '');
      this.dirty.set(false);
      this.confirmRemoval.set(false);
      this.feedback.set(user.username ? 'Username saved.' : 'Username removed.');
    } catch (error) {
      if (current())
        this.error.set(error instanceof Error ? error.message : 'Could not save username. Retry.');
    } finally {
      if (current()) this.saving.set(false);
    }
  }
}
