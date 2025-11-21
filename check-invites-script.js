// Browser Console Script to Check Birthday Invite Voters
// Copy and paste this into the browser console on /jda11202025 page

(async function checkInvites() {
  try {
    console.log('🎉 Fetching birthday poll data...\n');
    
    // Fetch from API
    const response = await fetch('/api/birthday-poll');
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    // Parse and organize the data
    const allVoters = [];
    let totalPeople = 0;
    
    console.log('📊 RESTAURANT VOTES & INVITES:\n');
    console.log('═'.repeat(60));
    
    data.restaurants.forEach(restaurant => {
      const isCantGo = restaurant.id === '6';
      const restaurantName = restaurant.name;
      const voteCount = restaurant.votes;
      const voters = restaurant.voters || [];
      
      if (voters.length > 0 || voteCount > 0) {
        console.log(`\n🏆 ${restaurantName}`);
        if (restaurant.description) {
          console.log(`   ${restaurant.description}`);
        }
        console.log(`   Votes: ${voteCount} (${voters.length} invite${voters.length !== 1 ? 's' : ''})`);
        
        if (voters.length > 0) {
          console.log(`\n   👥 Invites:`);
          voters.forEach((voter, index) => {
            // Parse voter name and guest count
            const match = voter.match(/^(.+?)(?:\s*\(\+(\d+)\))?$/);
            const name = match ? match[1] : voter;
            const guests = match && match[2] ? parseInt(match[2], 10) : 0;
            const totalForThisPerson = 1 + guests;
            
            console.log(`      ${index + 1}. ${name}${guests > 0 ? ` (+${guests} guest${guests !== 1 ? 's' : ''})` : ''} = ${totalForThisPerson} person${totalForThisPerson !== 1 ? 's' : ''}`);
            
            allVoters.push({
              name,
              guests,
              total: totalForThisPerson,
              restaurant: restaurantName
            });
            
            totalPeople += totalForThisPerson;
          });
        }
        console.log('   ' + '─'.repeat(50));
      }
    });
    
    // Summary
    console.log('\n\n📈 SUMMARY:\n');
    console.log('═'.repeat(60));
    console.log(`Total Invites: ${allVoters.length}`);
    console.log(`Total People: ${totalPeople}`);
    console.log(`\nBreakdown by Restaurant:`);
    
    const byRestaurant = {};
    allVoters.forEach(voter => {
      if (!byRestaurant[voter.restaurant]) {
        byRestaurant[voter.restaurant] = { invites: 0, people: 0 };
      }
      byRestaurant[voter.restaurant].invites++;
      byRestaurant[voter.restaurant].people += voter.total;
    });
    
    Object.entries(byRestaurant)
      .sort((a, b) => b[1].people - a[1].people)
      .forEach(([restaurant, stats]) => {
        console.log(`  ${restaurant}: ${stats.invites} invite${stats.invites !== 1 ? 's' : ''}, ${stats.people} person${stats.people !== 1 ? 's' : ''}`);
      });
    
    // Full list of all voters
    console.log(`\n\n👥 ALL INVITES (Alphabetical):\n`);
    console.log('═'.repeat(60));
    allVoters
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((voter, index) => {
        console.log(`${(index + 1).toString().padStart(3, ' ')}. ${voter.name.padEnd(25, ' ')} → ${voter.restaurant.padEnd(25, ' ')} (${voter.total} person${voter.total !== 1 ? 's' : ''})`);
      });
    
    // Show voter registry if available (who voted for what)
    if (data.voterRegistry) {
      console.log(`\n\n🗳️  VOTER REGISTRY (Who Voted For What):\n`);
      console.log('═'.repeat(60));
      const registryEntries = Object.entries(data.voterRegistry);
      if (registryEntries.length > 0) {
        registryEntries
          .sort((a, b) => a[0].localeCompare(b[0]))
          .forEach(([name, restaurantId]) => {
            const restaurant = data.restaurants.find(r => r.id === restaurantId);
            const restaurantName = restaurant ? restaurant.name : `Restaurant ID: ${restaurantId}`;
            console.log(`  ${name.padEnd(25, ' ')} → ${restaurantName}`);
          });
      } else {
        console.log('  No voter registry data available');
      }
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('✅ Done! Data also available in returned object.');
    
    // Return the data for further inspection
    return {
      restaurants: data.restaurants,
      allVoters,
      totalPeople,
      totalInvites: allVoters.length,
      summary: byRestaurant,
      voterRegistry: data.voterRegistry || {}
    };
    
  } catch (error) {
    console.error('❌ Error fetching invite data:', error);
    console.log('\n💡 Trying fallback method...');
    
    // Fallback: try the exposed function
    if (typeof window !== 'undefined' && window.getBirthdayPollData) {
      try {
        const data = await window.getBirthdayPollData();
        console.log('📊 Data from fallback:', data);
        return data;
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
      }
    }
    
    // Last resort: localStorage
    const localData = localStorage.getItem('birthday-poll-restaurants');
    if (localData) {
      console.log('📊 Data from localStorage:', JSON.parse(localData));
      return JSON.parse(localData);
    }
    
    throw error;
  }
})();

