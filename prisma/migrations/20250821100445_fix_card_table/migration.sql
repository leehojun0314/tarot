BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Card] ADD [business] TEXT NOT NULL CONSTRAINT [Card_business_df] DEFAULT '',
[children] TEXT NOT NULL CONSTRAINT [Card_children_df] DEFAULT '',
[job] TEXT NOT NULL CONSTRAINT [Card_job_df] DEFAULT '',
[move] TEXT NOT NULL CONSTRAINT [Card_move_df] DEFAULT '',
[path] TEXT NOT NULL CONSTRAINT [Card_path_df] DEFAULT '',
[promotion] TEXT NOT NULL CONSTRAINT [Card_promotion_df] DEFAULT '',
[study] TEXT NOT NULL CONSTRAINT [Card_study_df] DEFAULT '',
[trade] TEXT NOT NULL CONSTRAINT [Card_trade_df] DEFAULT '',
[wealth] TEXT NOT NULL CONSTRAINT [Card_wealth_df] DEFAULT '';

-- CreateTable
CREATE TABLE [dbo].[Paragraph] (
    [id] INT NOT NULL IDENTITY(1,1),
    [content] TEXT NOT NULL CONSTRAINT [Paragraph_content_df] DEFAULT '',
    [name] NVARCHAR(1000) NOT NULL CONSTRAINT [Paragraph_name_df] DEFAULT '',
    CONSTRAINT [Paragraph_pkey] PRIMARY KEY CLUSTERED ([id])
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
