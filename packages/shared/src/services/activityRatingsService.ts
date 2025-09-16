import { supabase } from './supabase';
import type { ActivityRating, ActivityRatingSummary } from '../types';

export class ActivityRatingsService {
  /**
   * Get all ratings for a specific trip
   */
  static async getRatingsForTrip(tripId: string): Promise<ActivityRating[]> {
    const { data, error } = await supabase
      .from('activity_ratings')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching ratings for trip:', error);
      throw new Error(`Failed to fetch ratings: ${error.message}`);
    }

    return (data || []).map(this.mapDatabaseToRating);
  }

  /**
   * Get ratings for a specific attraction within a trip
   */
  static async getRatingsForAttraction(tripId: string, attractionId: string): Promise<ActivityRating[]> {
    const { data, error } = await supabase
      .from('activity_ratings')
      .select('*')
      .eq('trip_id', tripId)
      .eq('attraction_id', attractionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching ratings for attraction:', error);
      throw new Error(`Failed to fetch ratings: ${error.message}`);
    }

    return (data || []).map(this.mapDatabaseToRating);
  }

  /**
   * Get rating summaries for a trip
   */
  static async getRatingSummariesForTrip(tripId: string): Promise<ActivityRatingSummary[]> {
    const { data, error } = await supabase
      .from('activity_rating_summaries')
      .select('*')
      .eq('trip_id', tripId)
      .order('average_rating', { ascending: false });

    if (error) {
      console.error('Error fetching rating summaries:', error);
      throw new Error(`Failed to fetch rating summaries: ${error.message}`);
    }

    return (data || []).map(this.mapDatabaseToSummary);
  }

  /**
   * Create or update a rating
   */
  static async upsertRating(rating: Partial<ActivityRating>): Promise<ActivityRating> {
    const dbRating = this.mapRatingToDatabase(rating);

    const { data, error } = await supabase
      .from('activity_ratings')
      .upsert(dbRating, {
        onConflict: 'trip_id,party_member_id,attraction_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting rating:', error);
      throw new Error(`Failed to save rating: ${error.message}`);
    }

    return this.mapDatabaseToRating(data);
  }

  /**
   * Delete a rating
   */
  static async deleteRating(ratingId: string): Promise<void> {
    console.log('Attempting to delete rating with ID:', ratingId);

    const { data, error } = await supabase
      .from('activity_ratings')
      .delete()
      .eq('id', ratingId)
      .select(); // Add select to see what was deleted

    console.log('Delete result:', { data, error });

    if (error) {
      console.error('Error deleting rating:', error);
      throw new Error(`Failed to delete rating: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.warn('No rating was deleted - rating may not exist or RLS policy blocked deletion');
    }
  }

  /**
   * Get a user's rating for a specific attraction
   */
  static async getUserRating(
    tripId: string,
    partyMemberId: string,
    attractionId: string
  ): Promise<ActivityRating | null> {
    const { data, error } = await supabase
      .from('activity_ratings')
      .select('*')
      .eq('trip_id', tripId)
      .eq('party_member_id', partyMemberId)
      .eq('attraction_id', attractionId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user rating:', error);
      throw new Error(`Failed to fetch user rating: ${error.message}`);
    }

    return data ? this.mapDatabaseToRating(data) : null;
  }

  /**
   * Bulk create/update ratings for a party member
   */
  static async bulkUpsertRatings(ratings: Partial<ActivityRating>[]): Promise<ActivityRating[]> {
    const dbRatings = ratings.map(this.mapRatingToDatabase);

    const { data, error } = await supabase
      .from('activity_ratings')
      .upsert(dbRatings, {
        onConflict: 'trip_id,party_member_id,attraction_id',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      console.error('Error bulk upserting ratings:', error);
      throw new Error(`Failed to save ratings: ${error.message}`);
    }

    return (data || []).map(this.mapDatabaseToRating);
  }

  /**
   * Get ratings with consensus issues (conflict level)
   */
  static async getConflictingRatings(tripId: string): Promise<ActivityRatingSummary[]> {
    const { data, error } = await supabase
      .from('activity_rating_summaries')
      .select('*')
      .eq('trip_id', tripId)
      .eq('consensus_level', 'conflict')
      .order('average_rating', { ascending: false });

    if (error) {
      console.error('Error fetching conflicting ratings:', error);
      throw new Error(`Failed to fetch conflicting ratings: ${error.message}`);
    }

    return (data || []).map(this.mapDatabaseToSummary);
  }

  /**
   * Get high-priority attractions (must-do items)
   */
  static async getHighPriorityAttractions(tripId: string): Promise<ActivityRatingSummary[]> {
    const { data, error } = await supabase
      .from('activity_rating_summaries')
      .select('*')
      .eq('trip_id', tripId)
      .gt('must_do_count', 0)
      .order('must_do_count', { ascending: false });

    if (error) {
      console.error('Error fetching high priority attractions:', error);
      throw new Error(`Failed to fetch high priority attractions: ${error.message}`);
    }

    return (data || []).map(this.mapDatabaseToSummary);
  }

  // Helper methods for mapping between database and TypeScript types

  private static mapDatabaseToRating(dbRating: any): ActivityRating {
    return {
      id: dbRating.id,
      tripId: dbRating.trip_id,
      partyMemberId: dbRating.party_member_id,
      attractionId: dbRating.attraction_id,
      activityType: dbRating.activity_type,
      rating: dbRating.rating,
      preferenceType: dbRating.preference_type,
      notes: dbRating.notes,
      heightRestrictionOk: dbRating.height_restriction_ok,
      intensityComfortable: dbRating.intensity_comfortable,
      createdAt: dbRating.created_at,
      updatedAt: dbRating.updated_at
    };
  }

  private static mapDatabaseToSummary(dbSummary: any): ActivityRatingSummary {
    return {
      id: dbSummary.id,
      tripId: dbSummary.trip_id,
      attractionId: dbSummary.attraction_id,
      activityType: dbSummary.activity_type,
      averageRating: dbSummary.average_rating,
      ratingCount: dbSummary.rating_count,
      mustDoCount: dbSummary.must_do_count,
      avoidCount: dbSummary.avoid_count,
      consensusLevel: dbSummary.consensus_level,
      heightRestrictedCount: dbSummary.height_restricted_count,
      intensityConcernsCount: dbSummary.intensity_concerns_count,
      lastCalculatedAt: dbSummary.last_calculated_at,
      createdAt: dbSummary.created_at,
      updatedAt: dbSummary.updated_at
    };
  }

  private static mapRatingToDatabase(rating: Partial<ActivityRating>): any {
    const dbRating: any = {
      trip_id: rating.tripId,
      party_member_id: rating.partyMemberId,
      attraction_id: rating.attractionId,
      activity_type: rating.activityType,
      rating: rating.rating,
      preference_type: rating.preferenceType,
      notes: rating.notes,
      height_restriction_ok: rating.heightRestrictionOk,
      intensity_comfortable: rating.intensityComfortable
    };

    // Only include id if it exists (for updates)
    if (rating.id) {
      dbRating.id = rating.id;
    }

    // Remove undefined values
    Object.keys(dbRating).forEach(key => {
      if (dbRating[key] === undefined) {
        delete dbRating[key];
      }
    });

    return dbRating;
  }
}

export default ActivityRatingsService;