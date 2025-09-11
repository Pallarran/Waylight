# Waylight - App Store Assets & Metadata

## App Information
- **App Name**: Waylight
- **Bundle ID (iOS)**: com.waylight.app
- **Package Name (Android)**: com.waylight.app
- **Version**: 1.0.1
- **Build Number (iOS)**: 1
- **Version Code (Android)**: 1

## App Store Descriptions

### Short Description (Apple App Store Subtitle, Google Play Short Description)
Your magical Disney World trip planner. Plan your days with clarity and calm.

### Long Description (Both Stores)

**Transform your Walt Disney World visit into a magical, stress-free experience with Waylight.**

Waylight is the ultimate companion for planning your Disney World vacation. Our offline-first app helps you create detailed itineraries, discover attractions, and make the most of your magical vacation.

**Key Features:**
✨ **Complete Trip Planning** - Create multi-day itineraries with drag-and-drop simplicity
🏰 **Comprehensive Attraction Database** - 50+ Magic Kingdom attractions with insider tips
📱 **Works Offline** - Plan your trip anywhere, no internet required
🎯 **Smart Search & Filters** - Find attractions by park, intensity, and features
💡 **Expert Tips** - Over 150 insider tips for the best Disney experience
📊 **Easy Export** - Share your plans with family and friends

**Perfect for:**
- First-time Disney visitors who want to maximize their experience
- Disney veterans looking for better organization
- Families planning magical vacations together
- Anyone who wants to reduce stress and increase magic

**Offline-First Design:**
Waylight works completely offline, so you can plan your trip at home and use it in the parks without worrying about poor cell service or data usage.

Start planning your magical Disney World adventure today with Waylight!

### Keywords (Apple App Store)
disney, theme park, trip planner, walt disney world, travel, vacation, itinerary, magic kingdom, family travel, orlando

### Keywords (Google Play Store)
disney world, theme park planner, trip planning, disney vacation, magic kingdom, family travel, itinerary builder, offline planner, walt disney world, orlando travel

## App Store Categories
- **Primary Category**: Travel
- **Secondary Category**: Productivity

## Content Rating
- **Age Rating**: 4+ (All Ages)
- **Content**: No objectionable content

## App Store Screenshots Needed

### iPhone Screenshots (Required sizes: 6.7", 6.5", 5.5")
1. **Home Screen** - "Plan Your Magical Disney Adventure"
2. **Trip Builder** - "Create Perfect Itineraries"
3. **Attraction Browser** - "Discover 50+ Magic Kingdom Attractions"
4. **Trip Details** - "Organize Your Days with Ease"
5. **Offline Ready** - "Works Everywhere, Even Without Internet"

### iPad Screenshots (Required sizes: 12.9", 11")
1. **Dashboard View** - Full trip overview
2. **Attraction Grid** - Browse attractions efficiently
3. **Day Planner** - Detailed itinerary management

### Android Screenshots (Required sizes: Various phones and tablets)
- Same content as iPhone, adapted for Android design patterns

## App Icon Checklist
- [x] **1024x1024** - App Store icon (packages/mobile/assets/icon.png)
- [x] **Adaptive Icon** - Android foreground (packages/mobile/assets/adaptive-icon.png)
- [ ] **Small icons** - Generated automatically by Expo

## Privacy Policy & Support
- **Privacy Policy URL**: https://waylight.whitetowers.org/privacy (needs to be created)
- **Support URL**: https://waylight.whitetowers.org/support (needs to be created)
- **Marketing URL**: https://waylight.whitetowers.org

## App Store Review Information

### Review Notes
This app is designed for Walt Disney World trip planning and uses publicly available attraction information. The app works entirely offline and does not collect user data or require account creation.

### Demo Account
Not required - the app works without login and all features are accessible immediately.

### Review Contact Information
- **Email**: support@whitetowers.org
- **Phone**: [Your phone number]
- **Notes**: Available for any questions about app functionality

## Release Strategy

### Phase 1: TestFlight/Internal Testing
- [ ] Upload to TestFlight for iOS beta testing
- [ ] Internal testing with small group
- [ ] Bug fixes and refinements

### Phase 2: Store Submission
- [ ] Submit to Apple App Store
- [ ] Submit to Google Play Store
- [ ] Wait for review (typically 1-7 days)

### Phase 3: Public Release
- [ ] Monitor reviews and ratings
- [ ] Collect user feedback
- [ ] Plan post-launch updates

## Technical Requirements Met
- [x] **iOS**: Supports iPhone and iPad
- [x] **Android**: Supports phones and tablets
- [x] **Offline Functionality**: Complete offline operation
- [x] **Performance**: Optimized for smooth performance
- [x] **Accessibility**: Screen reader compatible
- [x] **Privacy**: No personal data collection

## Next Steps for App Store Deployment

### Manual EAS Setup (Interactive required)
1. Open terminal in packages/mobile
2. Run `eas init` and answer prompts:
   - Create project for @palarran/waylight-new? **Yes**
   - Link to existing project? **No, create new**
3. Run `eas build:configure` and select:
   - iOS? **Yes**
   - Android? **Yes**

### Build Commands (After EAS setup)
```bash
# For internal testing
eas build --platform ios --profile preview
eas build --platform android --profile preview

# For app store release
eas build --platform ios --profile production
eas build --platform android --profile production
```

### Submit to Stores
```bash
# After successful production builds
eas submit --platform ios
eas submit --platform android
```