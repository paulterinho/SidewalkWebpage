package models.region
import models.utils.MyPostgresDriver.api._
import play.api.Play.current

import play.api.Play
import play.api.db.slick.DatabaseConfigProvider
import slick.driver.JdbcProfile
import scala.concurrent.Future

case class RegionType(regionTypeId: Int, regionType: String)

class RegionTypeTable(tag: Tag) extends Table[RegionType](tag, Some("sidewalk"), "region_type") {
  def regionTypeId = column[Int]("region_type_id", O.PrimaryKey)
  def regionType = column[String]("region_type")

  def * = (regionTypeId, regionType) <> ((RegionType.apply _).tupled, RegionType.unapply)
}

object RegionTypeTable {
  val db = play.api.db.slick.DB
  val regionTypes = TableQuery[RegionTypeTable]

  /**
   * Returns a list of all the sidewalk edges
   * @return A list of SidewalkEdge objects.
   */
  def all: List[RegionType] = db.withSession { implicit session =>
    regionTypes.list
  }
}
