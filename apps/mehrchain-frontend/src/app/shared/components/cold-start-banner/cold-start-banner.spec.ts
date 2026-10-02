import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ColdStartBannerComponent } from './cold-start-banner';
import { ColdStartService } from '../../../core/services/cold-start.service';
import { commonTestProviders } from '../../../../testing/test-providers';

describe('ColdStartBannerComponent', () => {
  let component: ColdStartBannerComponent;
  let fixture: ComponentFixture<ColdStartBannerComponent>;
  let coldStartService: ColdStartService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColdStartBannerComponent],
      providers: [commonTestProviders, ColdStartService],
    }).compileComponents();

    fixture = TestBed.createComponent(ColdStartBannerComponent);
    component = fixture.componentInstance;
    coldStartService = TestBed.inject(ColdStartService);
    fixture.detectChanges();
  });

  it('should create and initially be hidden', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
  });

  it('should display banner when isColdStarting is true', () => {
    coldStartService.isColdStarting.set(true);
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('[role="status"]');
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('Waking up Mero...');
    expect(banner.textContent).toContain('Free servers need a moment to warm up');
  });

  it('should dismiss banner when close button is clicked', () => {
    coldStartService.isColdStarting.set(true);
    fixture.detectChanges();

    const dismissBtn = fixture.nativeElement.querySelector('button');
    expect(dismissBtn).toBeTruthy();
    dismissBtn.click();
    fixture.detectChanges();

    expect(coldStartService.isColdStarting()).toBe(false);
  });
});
