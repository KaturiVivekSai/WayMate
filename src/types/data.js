// Pre-seeded authentic community mobility data
// Reflecting realistic campus & PG short-distance routes

export const CAMPUS_LOCATIONS = [
  'PVPSIT Parking',
  'Main Block / Admin',
  'Central Library',
  'Green Residency PG',
  'Central PG',
  'Lakeview Hostel',
  'Student Housing Complex',
  'Campus Food Street',
  'Metro Station (Purple Line)',
  'Blossom Girls PG',
  'Tech Park Gate 2'
];

export const INITIAL_USER = {
  id: 'user-koushik',
  username: 'koushik',
  name: 'Koushik',
  email: 'koushik@campus.edu',
  phone: '+91 98765 43210',
  collegeId: 'PES2023UG0941',
  role: 'Student (Hostel & Commuter)',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  isVerified: true,
  verificationStep: 'VERIFIED', // 'PENDING', 'VERIFIED'
  rating: 4.8,
  reviewsCount: 25,
  ridesCompleted: 18,
  ridesShared: 7,
  community: 'Green Residency & PES Campus Circle',
  vehicle: 'Yamaha FZ-S (KA-05-ES-4102)',
  reliabilityScore: '98%',
  mutualConnections: 14,
  collegeDomain: 'campus.edu',
  bikeNumber: 'KA-05-ES-4102',
  bikeColour: 'Midnight Blue',
  isEv: false,
  passwordHash: '1b029d305ceda46b954ef9eac1a6c81203390a49474548fee7bb2b1e15e28262',
  generatedUserId: 'WM-1001',
  verificationStatus: 'VERIFIED'

};

export const INITIAL_PROVIDERS = [
  {
    id: 'prov-arjun',
    name: 'Arjun',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    college: 'Campus Tech · 3rd Year',
    community: 'Green Residency PG',
    isVerified: true,
    rating: 4.9,
    ridesCompleted: 34,
    ridesShared: 21,
    vehicle: 'Honda Activa 6G (KA-04-AB-1928)',
    reliabilityScore: '99%'
  },
  {
    id: 'prov-priya',
    name: 'Priya',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    college: 'Campus Tech · 2nd Year',
    community: 'Central PG',
    isVerified: true,
    rating: 4.9,
    ridesCompleted: 29,
    ridesShared: 15,
    vehicle: 'TVS Jupiter 125 (KA-01-HG-8821)',
    reliabilityScore: '97%'
  },
  {
    id: 'prov-rahul',
    name: 'Rahul',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    college: 'Campus BioTech · 4th Year',
    community: 'Lakeview Hostel',
    isVerified: true,
    rating: 4.8,
    ridesCompleted: 42,
    ridesShared: 28,
    vehicle: 'Royal Enfield Hunter 350 (KA-03-MM-4410)',
    reliabilityScore: '96%'
  },
  {
    id: 'prov-neha',
    name: 'Neha',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    college: 'Campus Design · 3rd Year',
    community: 'Blossom Girls PG',
    isVerified: true,
    rating: 4.7,
    ridesCompleted: 19,
    ridesShared: 9,
    vehicle: 'Hero Pleasure+ (KA-05-PQ-7712)',
    reliabilityScore: '95%'
  },
  {
    id: 'prov-karthik',
    name: 'Karthik',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    college: 'Campus CS · 3rd Year',
    community: 'Metro PG',
    isVerified: true,
    rating: 4.8,
    ridesCompleted: 22,
    ridesShared: 11,
    vehicle: 'Suzuki Access 125 (KA-51-EF-3319)',
    reliabilityScore: '98%'
  }
];

export const INITIAL_RIDES = [
  {
    id: 'ride-101',
    providerId: 'prov-arjun',
    provider: INITIAL_PROVIDERS[0],
    from: 'PVPSIT Parking',
    to: 'Green Residency PG',
    date: 'Today',
    departureTime: '5:35 PM',
    seatsTotal: 2,
    seatsAvailable: 2,
    distanceKm: 4.2,
    contribution: 14,
    vehicle: 'Honda Activa 6G',
    note: 'Leaving right after lab ends. Have a sanitized spare helmet for pillion rider.',
    status: 'ACTIVE',
    createdAt: Date.now() - 3600000
  },
  {
    id: 'ride-102',
    providerId: 'prov-priya',
    provider: INITIAL_PROVIDERS[1],
    from: 'Central Library',
    to: 'Central PG',
    date: 'Today',
    departureTime: '5:50 PM',
    seatsTotal: 1,
    seatsAvailable: 1,
    distanceKm: 3.8,
    contribution: 12,
    vehicle: 'TVS Jupiter 125',
    note: 'Quick ride stopping near Food Street if you need a drop along the way.',
    status: 'ACTIVE',
    createdAt: Date.now() - 7200000
  },
  {
    id: 'ride-103',
    providerId: 'prov-rahul',
    provider: INITIAL_PROVIDERS[2],
    from: 'PVPSIT Parking',
    to: 'Student Housing Complex',
    date: 'Today',
    departureTime: '6:15 PM',
    seatsTotal: 1,
    seatsAvailable: 1,
    distanceKm: 6.1,
    contribution: 19,
    vehicle: 'Royal Enfield Hunter 350',
    note: 'Direct ride via Ring Road to Student Housing. Relaxed pace.',
    status: 'ACTIVE',
    createdAt: Date.now() - 10800000
  },
  {
    id: 'ride-104',
    providerId: 'prov-neha',
    provider: INITIAL_PROVIDERS[3],
    from: 'Campus Food Street',
    to: 'Blossom Girls PG',
    date: 'Today',
    departureTime: '6:45 PM',
    seatsTotal: 1,
    seatsAvailable: 1,
    distanceKm: 3.0,
    contribution: 10,
    vehicle: 'Hero Pleasure+',
    note: 'Carrying lightweight groceries in front boot. Pillion seat completely free.',
    status: 'ACTIVE',
    createdAt: Date.now() - 14400000
  },
  {
    id: 'ride-105',
    providerId: 'prov-karthik',
    provider: INITIAL_PROVIDERS[4],
    from: 'Main Block / Admin',
    to: 'Metro Station (Purple Line)',
    date: 'Today',
    departureTime: '7:10 PM',
    seatsTotal: 2,
    seatsAvailable: 2,
    distanceKm: 5.5,
    contribution: 17,
    vehicle: 'Suzuki Access 125',
    note: 'Heading to catch the 7:30 PM train. Punctual departure.',
    status: 'ACTIVE',
    createdAt: Date.now() - 18000000
  }
];

export const INITIAL_WALLET = {
  balance: 184,
  thisMonthEarned: 72,
  thisMonthUsed: 48,
  transactions: [
    {
      id: 'tx-1',
      type: 'EARNED',
      amount: 18,
      description: 'Shared journey with Priya to Central PG',
      date: 'Yesterday · 6:10 PM',
      rideId: 'ride-hist-1',
      timestamp: Date.now() - 86400000
    },
    {
      id: 'tx-2',
      type: 'USED',
      amount: 14,
      description: 'Reserved seat with Arjun (Campus → PG)',
      date: '2 days ago · 5:40 PM',
      rideId: 'ride-hist-2',
      timestamp: Date.now() - 172800000
    },
    {
      id: 'tx-3',
      type: 'USED',
      amount: 12,
      description: 'Reserved seat with Rahul (Library → Central)',
      date: '3 days ago · 1:15 PM',
      rideId: 'ride-hist-3',
      timestamp: Date.now() - 259200000
    },
    {
      id: 'tx-4',
      type: 'EARNED',
      amount: 36,
      description: 'Shared 2 seats to Metro Station',
      date: '5 days ago · 9:20 AM',
      rideId: 'ride-hist-4',
      timestamp: Date.now() - 432000000
    },
    {
      id: 'tx-5',
      type: 'EARNED',
      amount: 18,
      description: 'Shared journey with Karthik',
      date: '1 week ago · 4:30 PM',
      rideId: 'ride-hist-5',
      timestamp: Date.now() - 604800000
    },
    {
      id: 'tx-6',
      type: 'USED',
      amount: 22,
      description: 'Reserved seat with Neha to City Center',
      date: '1 week ago · 11:00 AM',
      rideId: 'ride-hist-6',
      timestamp: Date.now() - 691200000
    }
  ]
};

export const INITIAL_BOOKINGS = [
  {
    id: 'book-sample-1',
    rideId: 'ride-past-99',
    type: 'PASSENGER', // 'PASSENGER' or 'PROVIDER'
    from: 'Central Library',
    to: 'Green Residency PG',
    date: '3 days ago',
    time: '4:45 PM',
    partnerName: 'Priya',
    partnerRole: 'Provider',
    vehicle: 'TVS Jupiter 125',
    seatsBooked: 1,
    contribution: 12,
    status: 'COMPLETED', // 'UPCOMING', 'OFFERED', 'COMPLETED', 'CANCELLED'
    createdAt: Date.now() - 259200000
  }
];

export const INITIAL_LENDING = [
  {
    id: 'lend-1',
    ownerName: 'Rahul M.',
    ownerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    vehicle: 'Royal Enfield Hunter 350',
    plate: 'KA-03-MM-4410',
    rating: 4.9,
    ridesShared: 28,
    isVerified: true,
    condition: 'Full fuel tank, dual helmets provided, insured for verified peers',
    dailyCreditCost: 50,
    status: 'AVAILABLE' // 'AVAILABLE', 'REQUESTED', 'ACTIVE', 'RETURNED'
  },
  {
    id: 'lend-2',
    ownerName: 'Priya S.',
    ownerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    vehicle: 'TVS Jupiter 125',
    plate: 'KA-01-HG-8821',
    rating: 4.9,
    ridesShared: 29,
    isVerified: true,
    condition: 'Ideal for short PG grocery runs & library commute, sanitized helmet',
    dailyCreditCost: 35,
    status: 'AVAILABLE'
  },
  {
    id: 'lend-3',
    ownerName: 'Vikram R.',
    ownerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    vehicle: 'Honda Shine 125',
    plate: 'KA-05-JL-9031',
    rating: 4.8,
    ridesShared: 17,
    isVerified: true,
    condition: 'Currently with Ajay (Green Residency). Returning tomorrow 10:00 AM',
    dailyCreditCost: 30,
    status: 'IN_USE'
  }
];


export const INITIAL_EVENTS = [
  {
    id: 'event-hackathon',
    title: 'Campus Hackathon',
    date: 'Sep 18',
    time: '9:00 AM',
    location: 'Innovation Hall',
    demand: 'High',
    expectedDemand: 18
  },
  {
    id: 'event-freshers',
    title: 'Freshers Day',
    date: 'Sep 22',
    time: '10:00 AM',
    location: 'Main Auditorium',
    demand: 'High',
    expectedDemand: 26
  },
  {
    id: 'event-workshop',
    title: 'Placement Workshop',
    date: 'Sep 25',
    time: '2:00 PM',
    location: 'Seminar Block',
    demand: 'Moderate',
    expectedDemand: 10
  }
];

export const BASE_PLATFORM_STATS = {
  sharedRides: 12480,
  members: 3840,
  carbonSaved: 8.6,
  todayBooked: 42,
  todayOffered: 18,
  activeRequests: 11
};
