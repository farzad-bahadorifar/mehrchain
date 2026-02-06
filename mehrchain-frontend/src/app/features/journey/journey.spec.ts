import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Journey } from './journey';

describe('Journey', () => {
  let component: Journey;
  let fixture: ComponentFixture<Journey>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Journey]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Journey);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
