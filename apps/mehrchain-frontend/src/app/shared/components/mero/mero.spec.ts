import { ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestProviders } from '../../../../testing/test-providers';
import { MeroComponent } from './mero';
import { MeroRendererService } from './mero-renderer.service';

describe('MeroComponent', () => {
  let component: MeroComponent;
  let fixture: ComponentFixture<MeroComponent>;
  const target = { update: vi.fn(), setVisible: vi.fn(), destroy: vi.fn() };
  const renderer = { attach: vi.fn<MeroRendererService['attach']>(() => target) };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [MeroComponent],
      providers: [...commonTestProviders, { provide: MeroRendererService, useValue: renderer }],
    }).compileComponents();

    fixture = TestBed.createComponent(MeroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should map sizes to appropriate classes', () => {
    fixture.componentRef.setInput('size', 'hero');
    fixture.detectChanges();
    expect(component.sizeClasses()).toContain('w-56');

    fixture.componentRef.setInput('size', 'xs');
    fixture.detectChanges();
    expect(component.sizeClasses()).toBe('w-10 h-10');
  });

  it('should support custom glow gradient override', () => {
    const custom = 'radial-gradient(circle, #ff0000 0%, transparent 70%)';
    fixture.componentRef.setInput('customGradient', custom);
    fixture.detectChanges();
    expect(component.effectiveGradient()).toBe(custom);
  });

  it('renders an accessible procedural character without requesting the raster asset', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('canvas')).toBeTruthy();
    expect(element.querySelector('img')).toBeNull();
    fixture.componentRef.setInput('mood', 'sad');
    fixture.detectChanges();
    expect(element.querySelector('[role="img"]')?.getAttribute('aria-label')).toContain('sad');
    expect(element.querySelector('.mero-fallback')).toBeNull();
  });

  it('keeps both the character and glow hidden until a valid model frame is available', async () => {
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.mero--ready')).toBeNull();
    expect(element.querySelector('.mero-canvas--ready')).toBeNull();
    renderer.attach.mock.lastCall![2]('ready');
    fixture.detectChanges();
    expect(element.querySelector('.mero--ready')).toBeTruthy();
    expect(element.querySelector('.mero-canvas--ready')).toBeTruthy();
  });

  it('uses a neutral accessible label if no model frame can be rendered', async () => {
    await fixture.whenStable();
    renderer.attach.mock.lastCall![2]('unavailable');
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="img"]')?.getAttribute('aria-label')).toContain(
      'unavailable',
    );
    expect(element.querySelector('.mero--ready')).toBeNull();
    expect(element.querySelector('.mero-fallback')).toBeNull();
    expect(element.textContent).toContain('Mero');
  });

  it('updates the attached renderer when the expression changes', async () => {
    await fixture.whenStable();
    expect(renderer.attach).toHaveBeenCalled();
    target.update.mockClear();
    fixture.componentRef.setInput('mood', 'happy');
    fixture.detectChanges();
    expect(target.update).toHaveBeenLastCalledWith(expect.objectContaining({ mood: 'happy' }));
  });

  it('previews a draft color and returns to the account color when cleared', async () => {
    await fixture.whenStable();
    fixture.componentRef.setInput('previewColor', '#f43f5e');
    fixture.detectChanges();
    expect(target.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ glowColor: '#f43f5e' }),
    );
    fixture.componentRef.setInput('previewColor', undefined);
    fixture.detectChanges();
    expect(target.update).toHaveBeenLastCalledWith(expect.objectContaining({ glowColor: null }));
  });
});
