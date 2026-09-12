import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Commitment } from '@mehrchain/shared-data';
import { CommitmentStore, getUserStorageKey } from './commitment.store';

describe('CommitmentStore (@ngrx/signals)', () => {
  let store: CommitmentStore;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        CommitmentStore,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    store = TestBed.inject(CommitmentStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should initialize with empty state and no active user', () => {
    expect(store.commitments()).toEqual([]);
    expect(store.hasAnyCommitment()).toBe(false);
    expect(store.overallStreak()).toBe(0);
    expect(store.activeUserId()).toBeNull();
  });

  it('should load habits from isolated local cache when user logs in', () => {
    const userA_Id = 'user-alpha';
    const mockHabits: Commitment[] = [
      {
        id: 'c1',
        title: 'Morning Yoga',
        totalDays: 21,
        currentDay: 5,
        currentStreak: 5,
        isCompletedToday: true,
        category: 'health',
        startDate: new Date().toISOString(),
      },
    ];

    localStorage.setItem(getUserStorageKey(userA_Id), JSON.stringify(mockHabits));

    store.loadForUser(userA_Id);

    expect(store.activeUserId()).toBe(userA_Id);
    expect(store.commitments().length).toBe(1);
    expect(store.commitments()[0].title).toBe('Morning Yoga');
    expect(store.hasAnyCommitment()).toBe(true);
    expect(store.overallStreak()).toBe(5);
  });

  it('should completely purge in-memory state on resetState() without deleting local cache', () => {
    const userA_Id = 'user-alpha';
    const mockHabits: Commitment[] = [
      {
        id: 'c1',
        title: 'Morning Yoga',
        totalDays: 21,
        currentDay: 5,
        currentStreak: 5,
        isCompletedToday: true,
        category: 'health',
        startDate: new Date().toISOString(),
      },
    ];

    localStorage.setItem(getUserStorageKey(userA_Id), JSON.stringify(mockHabits));
    store.loadForUser(userA_Id);

    expect(store.commitments().length).toBe(1);

    // Act: User logs out
    store.resetState();

    // In-memory state must be empty
    expect(store.commitments()).toEqual([]);
    expect(store.archivedCommitments()).toEqual([]);
    expect(store.activeUserId()).toBeNull();
    expect(store.hasAnyCommitment()).toBe(false);

    // User A's local storage must remain for offline resilience
    const cached = localStorage.getItem(getUserStorageKey(userA_Id));
    expect(cached).not.toBeNull();
    expect(JSON.parse(cached!).length).toBe(1);
  });

  it('should ensure User B sees NO habits from User A (Cross-User Isolation)', () => {
    const userA_Id = 'user-alpha';
    const userB_Id = 'user-beta';

    // Step 1: User A logs in and has habits
    const userAHabits: Commitment[] = [
      {
        id: 'c1',
        title: 'Habit of User A',
        totalDays: 21,
        currentDay: 3,
        currentStreak: 3,
        isCompletedToday: false,
        category: 'growth',
        startDate: new Date().toISOString(),
      },
    ];
    localStorage.setItem(getUserStorageKey(userA_Id), JSON.stringify(userAHabits));
    store.loadForUser(userA_Id);
    expect(store.commitments()[0].title).toBe('Habit of User A');

    // Step 2: User A logs out
    store.resetState();
    expect(store.commitments()).toEqual([]);

    // Step 3: User B logs in (has no habits yet)
    store.loadForUser(userB_Id);
    expect(store.activeUserId()).toBe(userB_Id);
    expect(store.commitments()).toEqual([]);
    expect(store.hasAnyCommitment()).toBe(false);
  });

  it('should permanently erase user storage on clearUserStorage', () => {
    const userId = 'user-to-delete';
    localStorage.setItem(getUserStorageKey(userId), JSON.stringify([{ id: 'c99' }]));

    store.clearUserStorage(userId);

    expect(localStorage.getItem(getUserStorageKey(userId))).toBeNull();
  });
});
