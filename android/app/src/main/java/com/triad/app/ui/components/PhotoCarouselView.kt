package com.triad.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.triad.app.data.Photo

/** Mirrors iOS `PhotoCarouselView`. */
@Composable
fun PhotoCarouselView(
    photos: List<Photo>,
    height: Dp,
    showsPageCount: Boolean = true,
    modifier: Modifier = Modifier,
) {
    val ordered = photos.sortedWith(compareBy({ it.sortOrder }, { it.id }))

    if (ordered.isEmpty()) {
        RemoteMediaView(path = null, height = height, modifier = modifier)
        return
    }
    if (ordered.size == 1) {
        RemoteMediaView(path = ordered.first().url, height = height, modifier = modifier)
        return
    }

    val pagerState = rememberPagerState(pageCount = { ordered.size })
    Box(
        modifier
            .fillMaxWidth()
            .height(height)
            .clip(RoundedCornerShape(22.dp)),
    ) {
        HorizontalPager(state = pagerState) { index ->
            RemoteMediaView(path = ordered[index].url, height = height)
        }
        if (showsPageCount) {
            Box(
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(14.dp)
                    .background(Color.Black.copy(alpha = 0.38f), CircleShape)
                    .padding(horizontal = 10.dp, vertical = 6.dp),
            ) {
                Text(
                    text = "${pagerState.currentPage + 1} / ${ordered.size}",
                    color = Color.White,
                    style = MaterialTheme.typography.labelSmall,
                )
            }
        }
    }
}
