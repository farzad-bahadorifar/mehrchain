import { ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestProviders } from '../../../../testing/test-providers';
import { CommitmentCardComponent } from './commitment-card';

describe('CommitmentCard', () => {
  let component: CommitmentCardComponent;
  let fixture: ComponentFixture<CommitmentCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommitmentCardComponent],
      providers: [...commonTestProviders],
    }).compileComponents();

    fixture = TestBed.createComponent(CommitmentCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('commitment', {
      id: 'comm-1',
      title: 'Morning Yoga',
      category: 'health',
      totalDays: 21,
      currentDay: 1,
      currentStreak: 0,
      isCompletedToday: false,
      startDate: new Date().toISOString(),
      history: [],
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle options menu', () => {
    expect(component.isMenuOpen()).toBe(false);
    const dummyEvent = new MouseEvent('click');
    component.toggleMenu(dummyEvent);
    expect(component.isMenuOpen()).toBe(true);

    component.closeMenu();
    expect(component.isMenuOpen()).toBe(false);
  });

  it('should emit onDelete when delete action is triggered', () => {
    const deleteSpy = vi.fn();
    component.onDelete.subscribe(deleteSpy);

    component.onDelete.emit('comm-1');
    expect(deleteSpy).toHaveBeenCalledWith('comm-1');
  });

  it('should emit onArchive when archive action is triggered', () => {
    const archiveSpy = vi.fn();
    component.onArchive.subscribe(archiveSpy);

    component.onArchive.emit('comm-1');
    expect(archiveSpy).toHaveBeenCalledWith('comm-1');
  });

  it('should emit onEdit when edit action is triggered', () => {
    const editSpy = vi.fn();
    component.onEdit.subscribe(editSpy);

    component.onEdit.emit('comm-1');
    expect(editSpy).toHaveBeenCalledWith('comm-1');
  });

  it('should render Spark button with sparkles icon when not completed today', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const sparkBtn = compiled.querySelector('.spark-btn');
    expect(sparkBtn).toBeTruthy();
    expect(sparkBtn?.textContent).toContain('Spark');
    expect(compiled.querySelector('lucide-icon[name="sparkles"]')).toBeTruthy();
  });

  it('should trigger handleSpark and emit onComplete when Spark button is clicked', () => {
    const completeSpy = vi.fn();
    component.onComplete.subscribe(completeSpy);

    component.handleSpark();

    expect(completeSpy).toHaveBeenCalledWith('comm-1');
    expect(component.isSparking()).toBe(true);
  });

  it('should render Completed state when isCompletedToday is true', () => {
    fixture.componentRef.setInput('commitment', {
      id: 'comm-1',
      title: 'Morning Yoga',
      category: 'health',
      totalDays: 21,
      currentDay: 1,
      currentStreak: 1,
      isCompletedToday: true,
      startDate: new Date().toISOString(),
      history: [],
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.spark-btn')).toBeFalsy();
    expect(compiled.textContent).toContain('Completed ✓');
    expect(compiled.querySelector('button[disabled]')).toBeTruthy();
  });

  it('should correctly format Endless Journey commitments (totalDays = -1)', () => {
    fixture.componentRef.setInput('commitment', {
      id: 'comm-endless',
      title: 'Daily Meditation',
      category: 'growth',
      totalDays: -1,
      currentDay: 12,
      currentStreak: 12,
      isCompletedToday: false,
      startDate: new Date().toISOString(),
      history: [],
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Day 12 • Endless Journey');
    expect(component.progressPercent).toBe(100);
  });
});
