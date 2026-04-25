package com.triad.app.ui.profile

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.AccountTree
import androidx.compose.material.icons.filled.Cake
import androidx.compose.material.icons.filled.ChildCare
import androidx.compose.material.icons.filled.Diversity1
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Gavel
import androidx.compose.material.icons.filled.Height
import androidx.compose.material.icons.filled.LocalBar
import androidx.compose.material.icons.filled.LocalCafe
import androidx.compose.material.icons.filled.LocalFlorist
import androidx.compose.material.icons.filled.LocalPharmacy
import androidx.compose.material.icons.filled.LocationCity
import androidx.compose.material.icons.filled.MonitorWeight
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Public
import androidx.compose.material.icons.filled.SmokingRooms
import androidx.compose.material.icons.filled.Spa
import androidx.compose.ui.graphics.vector.ImageVector
import com.triad.app.data.UserProfile

data class PrefRow(val icon: ImageVector, val title: String, val value: String)

fun preferenceRows(profile: UserProfile): List<PrefRow> = listOf(
    PrefRow(Icons.Filled.Person, "Interested in", profile.interestedIn.orEmpty()),
    PrefRow(Icons.Filled.LocationCity, "Neighborhood", profile.neighborhood.orEmpty()),
    PrefRow(Icons.Filled.Height, "Height", profile.height.orEmpty()),
    PrefRow(Icons.Filled.MonitorWeight, "Weight", profile.weight.orEmpty()),
    PrefRow(Icons.Filled.Spa, "Physique", profile.physique.orEmpty()),
    PrefRow(Icons.Filled.Public, "Ethnicity", profile.ethnicity.orEmpty()),
    PrefRow(Icons.AutoMirrored.Filled.MenuBook, "Education", profile.educationLevel.orEmpty()),
    PrefRow(Icons.Filled.LocalFlorist, "Religion", profile.religion.orEmpty()),
    PrefRow(Icons.Filled.Favorite, "Relationship", profile.relationshipType.orEmpty()),
    PrefRow(Icons.Filled.ChildCare, "Children", profile.children.orEmpty()),
    PrefRow(Icons.Filled.Cake, "Family Plans", profile.familyPlans.orEmpty()),
    PrefRow(Icons.Filled.Diversity1, "Comfort w/ Intimacy", profile.comfortWithIntimacy.orEmpty()),
    PrefRow(Icons.Filled.LocalBar, "Drinking", profile.drinking.orEmpty()),
    PrefRow(Icons.Filled.SmokingRooms, "Smoking", profile.smoking.orEmpty()),
    PrefRow(Icons.Filled.LocalCafe, "Marijuana", profile.marijuana.orEmpty()),
    PrefRow(Icons.Filled.LocalPharmacy, "Drugs", profile.drugs.orEmpty()),
    PrefRow(Icons.Filled.Gavel, "Politics", profile.politics.orEmpty()),
    PrefRow(Icons.Filled.AccountTree, "Sexual Preference", profile.sexualPreference.orEmpty()),
)

object PreferenceOptions {
    val intent = listOf("casual", "serious", "friendship", "exploring")
    val lookingFor = listOf("single", "couple")
    val interestedIn = listOf("Men", "Women", "Everyone", "Non-binary", "All genders", "Prefer not to say")
    val ethnicity = listOf(
        "Asian", "Black / African", "East Asian", "Hispanic / Latino", "Middle Eastern", "Mixed",
        "Native American", "Pacific Islander", "South Asian", "Southeast Asian", "White / Caucasian",
        "Other", "Prefer not to say",
    )
    val religion = listOf(
        "Agnostic", "Atheist", "Buddhist", "Catholic", "Christian", "Hindu", "Jewish", "Muslim",
        "Sikh", "Spiritual", "Other", "Prefer not to say",
    )
    val relationshipType = listOf(
        "Monogamous", "Ethical non-monogamy", "Open relationship", "Polyamory",
        "Not sure yet", "Prefer not to say",
    )
    val children = listOf(
        "Don't have children", "Have children", "Have & want more", "Don't want children",
        "Prefer not to say",
    )
    val familyPlans = listOf(
        "Want children", "Don't want children", "Open to it", "Not sure", "Prefer not to say",
    )
    val substance = listOf("Never", "Rarely", "Sometimes", "Often", "Prefer not to say")
    val drinking = listOf(
        "Never", "Sober", "Sober curious", "Socially", "Most nights", "Prefer not to say",
    )
    val politics = listOf(
        "Apolitical", "Liberal", "Moderate", "Conservative", "Progressive", "Other",
        "Prefer not to say",
    )
    val education = listOf(
        "High school", "Some college", "Associate's", "Bachelor's", "Master's", "PhD",
        "Trade / Vocational", "Other", "Prefer not to say",
    )
    val physique = listOf(
        "Slim", "Athletic", "Average", "Muscular", "Curvy", "Full-figured",
        "A few extra pounds", "Prefer not to say",
    )
    val sexualPreference = listOf(
        "Straight", "Gay", "Lesbian", "Bisexual", "Pansexual", "Queer", "Voyager",
        "Open to new", "Prefer not to say",
    )
    val comfortWithIntimacy = listOf(
        "New to this", "A little experience", "Comfortable", "Very comfortable", "Prefer not to say",
    )
}
